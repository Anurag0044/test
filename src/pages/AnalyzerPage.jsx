import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import { addHistoryEntry } from '../services/historyService';
import './AnalyzerPage.css';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/medicines`;

import { useChat } from '../context/ChatContext';

// ---- Status messages for the clinical AI flow ----
const STATUS_MESSAGES_MEDICINE = [
  'Initializing scan...',
  'Processing medicine image...',
  'Extracting names via OCR.space...',
  'Querying MedIntel database...',
  'Generating verified alternatives...',
];

const STATUS_MESSAGES_PRESCRIPTION = [
  'Initializing OCR engine...',
  'Uploading prescription to OCR.space...',
  'Extracting handwritten text...',
  'Parsing clinical content...',
  'Formatting prescription data...',
];

const STATUS_INTERVAL = 1300; // ms per message

// ---- Recent analyses (mock data for idle state) ----
const recentAnalyses = [
  { title: 'Dermatology Scan', desc: 'Analysis of topical steroid prescription for patient #MI-0922...', time: '2 hours ago', icon: 'dermatology' },
  { title: 'Cardiology Refill', desc: 'Potential drug interaction detected between Lisinopril and recent NSAID use...', time: '5 hours ago', icon: 'cardiology' },
  { title: 'Pediatric Intake', desc: 'Digitization of immunization records and weight-based dosage charts...', time: '1 day ago', icon: 'child_care' },
];

// ---- Processing stages ----
const STAGE = {
  IDLE: 0,
  PREVIEW: 1,
  PROCESSING: 2,
  TRANSITION: 3,
  RESULTS: 4,
  ERROR: 5,
};

// ---- Analysis modes ----
const MODE = {
  MEDICINE: 'medicine',
  PRESCRIPTION: 'prescription',
};

export default function AnalyzerPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'prescription' ? MODE.PRESCRIPTION : MODE.MEDICINE;

  const [isDragging, setIsDragging] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileBlob, setFileBlob] = useState(null);  // keep the raw file for OCR.space upload
  const [fileName, setFileName] = useState('');
  const [stage, setStage] = useState(STAGE.IDLE);
  const [statusIndex, setStatusIndex] = useState(0);
  const [results, setResults] = useState(null);
  const [apiError, setApiError] = useState(false);
  const [mode, setMode] = useState(initialMode);

  // Prescription-specific state
  const [prescriptionText, setPrescriptionText] = useState('');

  const { setChatOpen, setAnalyzerContext } = useChat();

  const statusTimerRef = useRef(null);
  const processTimerRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const previewTimerRef = useRef(null);

  const STATUS_MESSAGES = mode === MODE.PRESCRIPTION ? STATUS_MESSAGES_PRESCRIPTION : STATUS_MESSAGES_MEDICINE;

  // ---- File handling ----
  const handleFile = useCallback((file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setFileBlob(file);
    setFileName(file.name);
    setStage(STAGE.PREVIEW);
    setResults(null);
    setPrescriptionText('');
    setApiError(false);
    setStatusIndex(0);
    setAnalyzerContext('');

    // Auto-transition from preview to processing after 1.2s
    previewTimerRef.current = setTimeout(() => {
      setStage(STAGE.PROCESSING);
    }, 1200);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  // ---- Status message progression ----
  useEffect(() => {
    if (stage !== STAGE.PROCESSING) return;
    if (statusIndex >= STATUS_MESSAGES.length) return;

    statusTimerRef.current = setTimeout(() => {
      setStatusIndex(prev => prev + 1);
    }, STATUS_INTERVAL);

    return () => clearTimeout(statusTimerRef.current);
  }, [stage, statusIndex, STATUS_MESSAGES.length]);

  // ---- Trigger processing after status animation ----
  useEffect(() => {
    if (stage !== STAGE.PROCESSING) return;

    const totalDuration = STATUS_MESSAGES.length * STATUS_INTERVAL + 800;

    processTimerRef.current = setTimeout(() => {
      if (mode === MODE.PRESCRIPTION) {
        processDoctorPrescription();
      } else {
        processMedicineData();
      }
    }, totalDuration);

    return () => clearTimeout(processTimerRef.current);
  }, [stage]);

  // ---- Cleanup all timers ----
  useEffect(() => {
    return () => {
      clearTimeout(statusTimerRef.current);
      clearTimeout(processTimerRef.current);
      clearTimeout(transitionTimerRef.current);
      clearTimeout(previewTimerRef.current);
    };
  }, []);

  // ============================================================
  //  DOCTOR PRESCRIPTION — OCR.space API
  // ============================================================
  const processDoctorPrescription = async () => {
    let extractedText = '';
    let hadApiFailure = false;

    try {
      const apiKey = import.meta.env.VITE_OCR_SPACE_API_KEY;
      if (!apiKey || !fileBlob) throw new Error('Missing API key or file');

      const formData = new FormData();
      formData.append('file', fileBlob);
      formData.append('apikey', apiKey);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Engine 2 is better for handwriting

      console.log('[MedIntel] Sending to OCR.space...');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data?.ParsedResults?.[0]?.ParsedText) {
        extractedText = data.ParsedResults[0].ParsedText;
      } else if (data?.ErrorMessage) {
        console.error('[MedIntel] OCR.space error:', data.ErrorMessage);
        hadApiFailure = true;
        extractedText = 'OCR service returned an error. Please try again with a clearer image.';
      } else {
        hadApiFailure = true;
        extractedText = 'No text could be extracted from this image. Please ensure the prescription is clear and readable.';
      }
    } catch (err) {
      console.error('[MedIntel] Prescription OCR error:', err);
      hadApiFailure = true;
      extractedText = 'Failed to connect to OCR service. Check your internet connection and try again.';
    }

    setPrescriptionText(extractedText);
    setApiError(hadApiFailure);

    // Log to history
    addHistoryEntry({
      name: 'Doctor Prescription Scan',
      dose: fileName,
      category: 'Prescription Upload',
      status: hadApiFailure ? 'Error' : 'Verified',
      savings: '₹0.00',
      alternatives: 0,
    });

    // Transition
    setStage(STAGE.TRANSITION);
    transitionTimerRef.current = setTimeout(() => {
      setStage(STAGE.RESULTS);
    }, 500);
  };

  // ============================================================
  //  MEDICINE IMAGE — MedIntel API + OCR.space Flow
  // ============================================================
  const processMedicineData = async () => {
    let finalResults = [];
    let hadApiFailure = false;

    try {
      // Step 1: OCR — Extract text using OCR.space (Engine 2 for better accuracy)
      let ocrText = '';
      const apiKey = import.meta.env.VITE_OCR_SPACE_API_KEY;

      if (fileBlob && apiKey) {
        try {
          console.log('[MedIntel] Starting Medicine OCR (OCR.space)...');
          const formData = new FormData();
          formData.append('file', fileBlob);
          formData.append('apikey', apiKey);
          formData.append('language', 'eng');
          formData.append('OCREngine', '2'); 
          
          const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData,
          });
          const ocrData = await ocrResponse.json();
          
          if (ocrData?.ParsedResults?.[0]?.ParsedText) {
            ocrText = ocrData.ParsedResults[0].ParsedText;
            console.log('[MedIntel] OCR.space Result:', ocrText);
          }
        } catch (ocrErr) {
          console.warn('[MedIntel] OCR.space failed, text extraction empty:', ocrErr);
        }
      }

      // Step 2: Extract candidate medicine names from OCR text
      const words = ocrText
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3)
        .map(w => w.toLowerCase());
      
      // Also try the filename as a search term
      if (fileName) {
        const cleanName = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, ' ').trim();
        if (cleanName.length >= 3) {
          words.unshift(cleanName.toLowerCase());
        }
      }

      const uniqueWords = [...new Set(words)];
      console.log('[MedIntel] Search candidates:', uniqueWords.slice(0, 15));

      // Step 3: Search the MedIntel API for each candidate word
      let foundMedicines = [];
      const searched = new Set();

      for (const word of uniqueWords.slice(0, 15)) {
        if (searched.has(word)) continue;
        searched.add(word);

        try {
          const res = await fetch(`${API_BASE}/search?name=${encodeURIComponent(word)}`);
          const data = await res.json();
          if (data.success && data.data?.length > 0) {
            for (const med of data.data) {
              if (!foundMedicines.find(m => m._id === med._id)) {
                foundMedicines.push(med);
              }
            }
          }
        } catch (err) {
          console.warn(`[MedIntel] Search failed for "${word}":`, err);
        }
        if (foundMedicines.length >= 5) break;
      }

      if (foundMedicines.length === 0) {
        hadApiFailure = true;
        finalResults = [{
          id: 'no-match',
          name: 'No Medicine Detected',
          dose: '-',
          instructions: 'Try uploading a clearer image with the medicine name visible.',
          description: 'We could not identify any medicine from this image using OCR.space. Ensure the text is readable.',
          alternatives: [],
        }];
      } else {
        // Step 4: Fetch alternatives using composition
        for (const med of foundMedicines) {
          let alternatives = [];
          if (med.composition) {
            try {
              const altRes = await fetch(`${API_BASE}/alternatives?composition=${encodeURIComponent(med.composition)}`);
              const altData = await altRes.json();
              if (altData.success && altData.data?.alternatives?.length > 0) {
                alternatives = altData.data.alternatives
                  .filter(a => a._id !== med._id)
                  .slice(0, 6);
              }
            } catch (err) {
              console.warn(`[MedIntel] Alternatives fetch failed for "${med.composition}":`, err);
            }
          }

          finalResults.push({
            id: med._id,
            name: med.name,
            dose: med.strength || 'As prescribed',
            instructions: med.usage || 'Follow your physician\'s instructions.',
            description: `${med.name} (${med.composition}). Manufacturer: ${med.manufacturer}.`,
            safetyNotes: med.sideEffects?.length ? `Side effects: ${med.sideEffects.join(', ')}.` : '',
            category: med.category || '',
            alternatives,
            composition: med.composition,
            manufacturer: med.manufacturer,
            price: med.price,
            safetyLevel: med.safetyLevel,
          });
        }
      }
    } catch (err) {
      console.error('[MedIntel] Analysis pipeline error:', err);
      hadApiFailure = true;
      setApiError(true);
    }

    setResults(finalResults);
    setApiError(hadApiFailure);

    // Build context for chatbot
    const ctxLines = finalResults.map(r =>
      `Medicine: ${r.name}\nComposition: ${r.composition}\nAlternatives: ${(r.alternatives || []).map(a => `${a.name} ₹${a.price}`).join(', ')}`
    ).join('\n---\n');
    setAnalyzerContext(ctxLines);

    // History logging
    for (const med of finalResults) {
      if (med.id === 'no-match') continue;
      addHistoryEntry({
        name: med.name,
        dose: med.dose,
        category: 'Medicine Scan',
        status: 'Verified',
        savings: med.alternatives?.[0] ? `₹${med.alternatives[0].price}` : '₹0.00',
        alternatives: med.alternatives?.length || 0,
      });
    }

    setStage(STAGE.TRANSITION);
    transitionTimerRef.current = setTimeout(() => {
      setStage(STAGE.RESULTS);
    }, 500);
  };

  // ---- Reset ----
  const handleReset = () => {
    setStage(STAGE.IDLE);
    setFileUrl(null);
    setFileBlob(null);
    setFileName('');
    setResults(null);
    setPrescriptionText('');
    setStatusIndex(0);
    setApiError(false);
    setAnalyzerContext('');
  };

  // ========================== RENDER ==========================

  // ---- Mode Selector ----
  const renderModeSelector = () => (
    <div className="mode-selector">
      <button
        className={`mode-btn ${mode === MODE.MEDICINE ? 'mode-btn-active' : ''}`}
        onClick={() => { setMode(MODE.MEDICINE); handleReset(); }}
      >
        <span className="material-icons-outlined">medication</span>
        <div>
          <strong>Medicine Analysis</strong>
          <span>Identify medicines &amp; find alternatives</span>
        </div>
      </button>
      <button
        className={`mode-btn ${mode === MODE.PRESCRIPTION ? 'mode-btn-active' : ''}`}
        onClick={() => { setMode(MODE.PRESCRIPTION); handleReset(); }}
      >
        <span className="material-icons-outlined">description</span>
        <div>
          <strong>Doctor Prescription</strong>
          <span>Extract text from handwritten prescriptions</span>
        </div>
      </button>
    </div>
  );

  // ---- Upload / Idle State ----
  const renderIdleState = () => (
    <>
      {renderModeSelector()}

      <div className="analyzer-grid">
        <div className="analyzer-left">
          <label
            className={`upload-zone card ${isDragging ? 'upload-zone-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input type="file" accept="image/*" className="hidden-file-input" onChange={handleFileChange} />
            <div className="upload-icon-ring">
              <span className="material-icons-outlined">
                {mode === MODE.PRESCRIPTION ? 'document_scanner' : 'cloud_upload'}
              </span>
            </div>
            <h3 className="title-lg">
              {mode === MODE.PRESCRIPTION ? 'Drop doctor prescription here' : 'Drop prescription here'}
            </h3>
            <p className="body-md text-muted">Supports JPG, PNG up to 10MB</p>
            <span className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>Browse Files</span>
          </label>
          <div className="hipaa-notice">
            <span className="material-icons-outlined icon-sm">verified_user</span>
            <div>
              <strong>HIPAA Compliant Processing</strong>
              <p className="body-md text-muted">
                All data is encrypted end-to-end and automatically redacted after analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="analyzer-right">
          <div className="card flat-info-card">
            <span className="material-icons-outlined text-primary" style={{ fontSize: '32px', marginBottom: '12px' }}>tips_and_updates</span>
            <h3 className="title-md">
              {mode === MODE.PRESCRIPTION ? 'For Best Prescription Scan' : 'For Accurate Results'}
            </h3>
            <ul className="info-list" style={{ marginTop: '16px' }}>
              {mode === MODE.PRESCRIPTION ? (
                <>
                  <li><span className="material-icons-outlined">check_circle</span> Make sure the entire prescription is visible</li>
                  <li><span className="material-icons-outlined">check_circle</span> Flatten any creases before photographing</li>
                  <li><span className="material-icons-outlined">check_circle</span> Use good lighting — avoid flash glare</li>
                  <li><span className="material-icons-outlined">check_circle</span> Handwritten text works best with OCR Engine 2</li>
                </>
              ) : (
                <>
                  <li><span className="material-icons-outlined">check_circle</span> Ensure good, even lighting</li>
                  <li><span className="material-icons-outlined">check_circle</span> Capture the entire prescription page</li>
                  <li><span className="material-icons-outlined">check_circle</span> Keep handwriting clearly visible</li>
                  <li><span className="material-icons-outlined">check_circle</span> Avoid shadows and glare</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="recent-analyses" style={{ marginTop: '32px' }}>
        <h3 className="title-lg" style={{ marginBottom: '20px' }}>Recent Clinical Analyses</h3>
        <div className="analyses-grid">
          {recentAnalyses.map((item, i) => (
            <div key={i} className="card analysis-card" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="analysis-icon-wrap">
                <span className="material-icons-outlined">{item.icon}</span>
              </div>
              <h4 className="title-md">{item.title}</h4>
              <p className="body-md text-muted">{item.desc}</p>
              <span className="body-md text-muted analysis-time">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  // ---- Upload Preview State ----
  const renderPreviewState = () => (
    <div className="clinical-preview animate-fade-in">
      <div className="preview-frame">
        {fileUrl && <img src={fileUrl} alt="Prescription Preview" className="preview-image" />}
      </div>
      <p className="body-md text-muted" style={{ textAlign: 'center', marginTop: '16px' }}>
        {mode === MODE.PRESCRIPTION ? 'Preparing prescription scan...' : 'Preparing analysis...'}
      </p>
    </div>
  );

  // ---- Processing State ----
  const renderProcessingState = () => {
    const progress = Math.min((statusIndex / STATUS_MESSAGES.length) * 100, 100);

    return (
      <div className={`clinical-processing ${stage === STAGE.TRANSITION ? 'fade-out' : 'animate-fade-in'}`}>
        <div className="processing-layout">
          {/* Left: Image being scanned */}
          <div className="scan-frame">
            {fileUrl && <img src={fileUrl} alt="Scanning prescription" className="scan-image" />}
            <div className="scan-line-overlay"></div>
          </div>

          {/* Right: AI status panel */}
          <div className="ai-status-panel">
            <div className="ai-indicator">
              <div className="ai-ring"></div>
              <div className="ai-core">
                <span className="material-icons-outlined">
                  {mode === MODE.PRESCRIPTION ? 'document_scanner' : 'psychology'}
                </span>
              </div>
            </div>

            <div className="status-messages">
              {STATUS_MESSAGES.map((msg, i) => (
                <div
                  key={i}
                  className={`status-line ${
                    i < statusIndex ? 'completed' :
                    i === statusIndex ? 'active' : 'pending'
                  }`}
                >
                  <span className="material-icons-outlined status-check">
                    {i < statusIndex ? 'check_circle' : i === statusIndex ? 'pending' : 'radio_button_unchecked'}
                  </span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>

            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---- Prescription Results ----
  const renderPrescriptionResults = () => (
    <div className="clinical-results animate-slide-up">
      {apiError && (
        <div className="api-fallback-notice">
          <span className="material-icons-outlined">info</span>
          <p>
            OCR could not fully process the image. The extracted text may be incomplete.
            Try uploading a clearer image.
          </p>
        </div>
      )}

      <div className="results-header">
        <div className="results-header-left">
          <span className="material-icons-outlined results-success-icon">
            {apiError ? 'warning_amber' : 'verified'}
          </span>
          <div>
            <h2 className="headline-sm">{apiError ? 'Partial Extraction' : 'Prescription Extracted'}</h2>
            <p className="body-md text-muted">
              Text extracted from: {fileName}
            </p>
          </div>
        </div>
        <div className="results-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => {
            navigator.clipboard.writeText(prescriptionText);
          }}>
            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>content_copy</span>
            Copy Text
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleReset}>
            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>refresh</span>
            New Scan
          </button>
        </div>
      </div>

      {/* Extracted Prescription Card */}
      <div className="prescription-result-card">
        <div className="prescription-result-layout">
          {/* Image preview */}
          <div className="prescription-image-wrap">
            {fileUrl && <img src={fileUrl} alt="Scanned prescription" className="prescription-image" />}
          </div>

          {/* Extracted text */}
          <div className="prescription-text-section">
            <div className="prescription-text-header">
              <span className="material-icons-outlined" style={{ color: '#22c55e' }}>description</span>
              <h3 className="title-md">Extracted Prescription Text</h3>
            </div>
            <div className="prescription-text-body">
              {prescriptionText.split('\n').map((line, i) => (
                <p key={i} className={line.trim() ? 'prescription-line' : 'prescription-line-empty'}>
                  {line.trim() || '\u00A0'}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="ai-source-badge">
          <span className="material-icons-outlined" style={{ fontSize: '14px' }}>auto_awesome</span>
          Powered by OCR.space API
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="medical-disclaimer">
        <span className="material-icons-outlined">info</span>
        <p>
          OCR extraction may not be 100% accurate for handwritten prescriptions.
          Always verify extracted text with the original document.
        </p>
      </div>
    </div>
  );

  // ---- Medicine Results State ----
  const renderMedicineResultsState = () => (
    <div className="clinical-results animate-slide-up">
      {/* API fallback notice */}
      {apiError && (
        <div className="api-fallback-notice">
          <span className="material-icons-outlined">info</span>
          <p>
            Some medicines could not be found in the database.
            Ensure the image has clear, readable medicine names.
          </p>
        </div>
      )}

      <div className="results-header">
        <div className="results-header-left">
          <span className="material-icons-outlined results-success-icon">verified</span>
          <div>
            <h2 className="headline-sm">Analysis Complete</h2>
            <p className="body-md text-muted">
              {results?.length || 0} medication{results?.length !== 1 ? 's' : ''} identified and verified
            </p>
          </div>
        </div>
        <div className="results-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => setChatOpen(true)}>
            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>smart_toy</span>
            Ask AI
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleReset}>
            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>refresh</span>
            New Analysis
          </button>
        </div>
      </div>

      <div className="medicine-results-grid">
        {results?.map((med, idx) => (
          <div className="medicine-result-card" key={med.id} style={{ animationDelay: `${idx * 150}ms` }}>
            {/* Category badge */}
            {med.category && (
              <div className="med-category-badge">{med.category}</div>
            )}

            {/* Medicine Info Section */}
            <div className="med-info-section">
              <div className="med-info-header">
                <div className="med-title-group">
                  <h3 className="title-lg">{med.name}</h3>
                  <span className="dose-badge">{med.dose}</span>
                </div>
                {med.price && (
                  <span className="med-price-tag">₹{med.price}</span>
                )}
              </div>

              {/* Composition & Manufacturer */}
              {(med.composition || med.manufacturer) && (
                <div className="med-meta-row">
                  {med.composition && (
                    <span className="med-meta-chip">
                      <span className="material-icons-outlined" style={{ fontSize: '14px' }}>science</span>
                      {med.composition}
                    </span>
                  )}
                  {med.manufacturer && (
                    <span className="med-meta-chip">
                      <span className="material-icons-outlined" style={{ fontSize: '14px' }}>business</span>
                      {med.manufacturer}
                    </span>
                  )}
                </div>
              )}

              <p className="med-description">{med.description}</p>

              {/* Safety Notes */}
              {med.safetyNotes && (
                <div className="med-safety-notes">
                  <span className="material-icons-outlined" style={{ fontSize: '16px', color: '#f59e0b' }}>warning_amber</span>
                  <p>{med.safetyNotes}</p>
                </div>
              )}

              <div className="med-instructions">
                <span className="material-icons-outlined" style={{ fontSize: '18px', color: '#22c55e' }}>medication</span>
                <p>{med.instructions}</p>
              </div>
            </div>

            {/* Alternatives Section */}
            {med.alternatives?.length > 0 && (
              <div className="alternatives-section">
                <h4 className="title-sm alternatives-heading">
                  <span className="material-icons-outlined" style={{ fontSize: '18px' }}>swap_horiz</span>
                  Alternatives ({med.alternatives.length})
                </h4>
                <div className="alternatives-grid">
                  {med.alternatives.map((alt, i) => (
                    <div className={`alt-card ${i === 0 ? 'cost-effective' : ''}`} key={i}>
                      <div className="alt-card-top">
                        <span className="alt-name">{alt.name}</span>
                        {i === 0 && <span className="alt-tag cost-tag">Cost Effective</span>}
                        {alt.savingsPercent > 0 && i !== 0 && (
                          <span className="alt-tag popular-tag">Save {alt.savingsPercent}%</span>
                        )}
                      </div>
                      <div className="alt-card-bottom">
                        <span className="alt-price">₹{alt.price}</span>
                        {alt.manufacturer && (
                          <span className="alt-manufacturer">{alt.manufacturer}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source badge */}
            <div className="ai-source-badge">
              <span className="material-icons-outlined" style={{ fontSize: '14px' }}>auto_awesome</span>
              Powered by MedIntel API
            </div>
          </div>
        ))}
      </div>

      {/* Medical Disclaimer */}
      <div className="medical-disclaimer">
        <span className="material-icons-outlined">info</span>
        <p>
          This information is for educational purposes only. Always consult a qualified healthcare
          professional before making any medical decisions.
        </p>
      </div>
    </div>
  );

  // ---- Decide which results view to render ----
  const renderResultsState = () => {
    if (mode === MODE.PRESCRIPTION) {
      return renderPrescriptionResults();
    }
    return renderMedicineResultsState();
  };

  return (
    <div className="analyzer">
      <header className="page-header">
        <div>
          <h1 className="headline-md">Prescription Analyzer</h1>
          <p className="body-md text-muted">
            {mode === MODE.PRESCRIPTION
              ? 'Upload a handwritten doctor prescription to extract readable text using AI OCR.'
              : 'Upload a handwritten or digital prescription to extract clinical data with AI precision.'}
          </p>
        </div>
      </header>

      {stage === STAGE.IDLE && renderIdleState()}
      {stage === STAGE.PREVIEW && renderPreviewState()}
      {(stage === STAGE.PROCESSING || stage === STAGE.TRANSITION) && renderProcessingState()}
      {stage === STAGE.RESULTS && renderResultsState()}
      {stage === STAGE.ERROR && renderResultsState()}

      <Footer />
    </div>
  );
}
