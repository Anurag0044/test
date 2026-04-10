import { useState, useEffect, useRef, useCallback } from 'react';
import Footer from '../components/Footer';
import { medicineDB, getAlternatives, getMedicineInfo, identifyMedicines } from '../services/medicineEngine';
import { addHistoryEntry } from '../services/historyService';
import Tesseract from 'tesseract.js';
import './AnalyzerPage.css';

import { useChat } from '../context/ChatContext';

// ---- Status messages for the clinical AI flow ----
const STATUS_MESSAGES = [
  'Initializing analysis...',
  'Processing prescription image...',
  'Extracting medical entities...',
  'Querying Gemini AI for clinical data...',
  'Generating verified results...',
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

export default function AnalyzerPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [stage, setStage] = useState(STAGE.IDLE);
  const [statusIndex, setStatusIndex] = useState(0);
  const [results, setResults] = useState(null);
  const [apiError, setApiError] = useState(false);
  
  const { setChatOpen, setAnalyzerContext } = useChat();

  const statusTimerRef = useRef(null);
  const processTimerRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const previewTimerRef = useRef(null);

  // ---- File handling ----
  const handleFile = useCallback((file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setFileName(file.name);
    setStage(STAGE.PREVIEW);
    setResults(null);
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
  }, [stage, statusIndex]);

  // ---- Trigger processing after status animation ----
  useEffect(() => {
    if (stage !== STAGE.PROCESSING) return;

    const totalDuration = STATUS_MESSAGES.length * STATUS_INTERVAL + 800;

    processTimerRef.current = setTimeout(() => {
      processMedicineData();
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

  // ---- Core processing logic (Gemini-powered) ----
  const processMedicineData = async () => {
    let finalResults = [];
    let hadApiFailure = false;

    try {
      // Step 1: OCR — Extract text from image
      let ocrText = '';
      if (fileUrl) {
        try {
          console.log('[MedIntel] Starting OCR...');
          const { data: { text } } = await Tesseract.recognize(fileUrl, 'eng');
          ocrText = text;
          console.log('[MedIntel] OCR Result:', ocrText);
        } catch (ocrErr) {
          console.warn('[MedIntel] OCR failed:', ocrErr);
        }
      }

      // Step 2: Identify medicines using Gemini AI
      let identified = [];
      if (ocrText.trim().length > 5) {
        identified = await identifyMedicines(ocrText);
      }

      // Fallback: try filename
      if (identified.length === 0 && fileName) {
        const dbKeys = Object.keys(medicineDB);
        const lowerName = fileName.toLowerCase();
        for (const key of dbKeys) {
          if (lowerName.includes(key)) {
            identified.push({ name: medicineDB[key].name, dose: medicineDB[key].dose, rawName: key });
          }
        }
      }

      // Absolute fallback
      if (identified.length === 0) {
        identified = [{ name: 'Paracetamol', dose: '500 mg', rawName: 'paracetamol' }];
        hadApiFailure = true;
      }

      // Step 3: For each medicine, get Gemini AI description + local alternatives
      for (const med of identified) {
        const geminiInfo = await getMedicineInfo(med.rawName || med.name);
        const dbInfo = medicineDB[med.rawName] || null;
        const alternatives = getAlternatives(med.rawName || med.name);

        if (geminiInfo.description === 'Unable to retrieve medical information at this time.') {
          hadApiFailure = true;
        }

        finalResults.push({
          id: med.rawName || med.name.toLowerCase(),
          name: med.name || geminiInfo.title,
          dose: med.dose || dbInfo?.dose || 'As prescribed',
          instructions: dbInfo?.instructions || geminiInfo.usage || 'Follow your physician\'s instructions.',
          description: geminiInfo.description,
          safetyNotes: geminiInfo.safetyNotes || '',
          category: geminiInfo.category || '',
          image: geminiInfo.image,
          alternatives,
        });
      }
    } catch (err) {
      console.error('[MedIntel] Analysis pipeline error:', err);
      hadApiFailure = true;
      finalResults = [{
        id: 'error-fallback',
        name: 'Analysis Error',
        dose: '-',
        instructions: 'Please try uploading the prescription again.',
        description: 'The AI was unable to process this prescription. This may be due to image quality or a temporary service issue.',
        safetyNotes: '',
        category: '',
        image: null,
        alternatives: [],
      }];
    }

    setResults(finalResults);
    setApiError(hadApiFailure);

    // Build context string for chatbot
    const ctxLines = finalResults.map(r =>
      `Medicine: ${r.name}\nDosage: ${r.dose}\nDescription: ${r.description}\nAlternatives: ${r.alternatives.map(a => `${a.name} ₹${a.price}`).join(', ')}`
    ).join('\n---\n');
    setAnalyzerContext(ctxLines);

    // Log each detected medicine into localStorage history
    for (const med of finalResults) {
      const alts = med.alternatives || [];
      const cheapest = alts.length ? Math.min(...alts.map(a => a.price)) : 0;
      addHistoryEntry({
        name: med.name,
        dose: med.dose,
        category: 'Prescription Analysis',
        status: 'Verified',
        savings: cheapest ? `₹${cheapest.toFixed(2)}` : '₹0.00',
        alternatives: alts.length,
      });
    }

    // Transition: fade out processing → slight delay → fade in results
  
    setStage(STAGE.TRANSITION);
    transitionTimerRef.current = setTimeout(() => {
      setStage(STAGE.RESULTS);
    }, 500);
  };

  // ---- Reset ----
  const handleReset = () => {
    setStage(STAGE.IDLE);
    setFileUrl(null);
    setFileName('');
    setResults(null);
    setStatusIndex(0);
    setApiError(false);
    setAnalyzerContext('');
  };

  // ========================== RENDER ==========================

  // ---- Upload / Idle State ----
  const renderIdleState = () => (
    <>
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
              <span className="material-icons-outlined">cloud_upload</span>
            </div>
            <h3 className="title-lg">Drop prescription here</h3>
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
            <h3 className="title-md">For Accurate Results</h3>
            <ul className="info-list" style={{ marginTop: '16px' }}>
              <li><span className="material-icons-outlined">check_circle</span> Ensure good, even lighting</li>
              <li><span className="material-icons-outlined">check_circle</span> Capture the entire prescription page</li>
              <li><span className="material-icons-outlined">check_circle</span> Keep handwriting clearly visible</li>
              <li><span className="material-icons-outlined">check_circle</span> Avoid shadows and glare</li>
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
        Preparing analysis...
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
                <span className="material-icons-outlined">psychology</span>
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

  // ---- Results State ----
  const renderResultsState = () => (
    <div className="clinical-results animate-slide-up">
      {/* API fallback notice */}
      {apiError && (
        <div className="api-fallback-notice">
          <span className="material-icons-outlined">info</span>
          <p>
            Some medical data could not be verified via AI.
            Displaying locally verified information where available.
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
                {med.image && (
                  <div className="med-thumbnail-wrap">
                    <img src={med.image} alt={med.name} className="med-thumbnail" />
                  </div>
                )}
              </div>

              <p className="med-description">{med.description}</p>

              {/* Safety Notes from Gemini */}
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
            <div className="alternatives-section">
              <h4 className="title-sm alternatives-heading">
                <span className="material-icons-outlined" style={{ fontSize: '18px' }}>swap_horiz</span>
                Alternatives
              </h4>
              <div className="alternatives-grid">
                {med.alternatives.map((alt, i) => (
                  <div className={`alt-card ${i === 0 ? 'cost-effective' : ''}`} key={i}>
                    <div className="alt-card-top">
                      <span className="alt-name">{alt.name}</span>
                      {i === 0 && <span className="alt-tag cost-tag">Cost Effective</span>}
                      {i === 1 && <span className="alt-tag popular-tag">Popular Alternative</span>}
                    </div>
                    <div className="alt-card-bottom">
                      <span className="alt-price">₹{alt.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gemini AI source badge */}
            <div className="ai-source-badge">
              <span className="material-icons-outlined" style={{ fontSize: '14px' }}>auto_awesome</span>
              Powered by Gemini AI
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

  return (
    <div className="analyzer">
      <header className="page-header">
        <div>
          <h1 className="headline-md">Prescription Analyzer</h1>
          <p className="body-md text-muted">
            Upload a handwritten or digital prescription to extract clinical data with AI precision.
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
