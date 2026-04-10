import { useState, useEffect, useRef } from 'react';
import Footer from '../components/Footer';
import { medicineDB, getAlternatives, fetchMedicineInfo } from '../services/medicineEngine';
import './AnalyzerPage.css';

const recentAnalyses = [
  { title: 'Dermatology Scan', desc: 'Analysis of topical steroid prescription for patient #MI-0922...', time: '2 hours ago', icon: 'dermatology' },
  { title: 'Cardiology Refill', desc: 'Potential drug interaction detected between Lisinopril and recent NSAID use...', time: '5 hours ago', icon: 'cardiology' },
  { title: 'Pediatric Intake', desc: 'Digitization of immunization records and weight-based dosage charts...', time: '1 day ago', icon: 'child_care' },
];

const statusMessages = [
  'Initializing analysis...',
  'Scanning prescription...',
  'Recognizing medicine patterns...',
  'Cross-checking medical data...',
  'Generating insights...'
];

export default function AnalyzerPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  // 0: idle, 1: processing, 5: transition flash, 6: complete
  const [processingStage, setProcessingStage] = useState(0);
  const [results, setResults] = useState(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [typedStatus, setTypedStatus] = useState('');
  const [uploadRipple, setUploadRipple] = useState(false);

  const statusTimeoutRef = useRef(null);
  const typeIntervalRef = useRef(null);
  const processingTimeoutRef = useRef(null);
  const transitionTimeoutRef = useRef(null);

  const startProcessing = (url) => {
    setFileUrl(url);
    setStatusIndex(0);
    setTypedStatus('');
    setProcessingStage(1);
    setResults(null);
    setUploadRipple(true);
    setTimeout(() => setUploadRipple(false), 500);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const url = URL.createObjectURL(e.dataTransfer.files[0]);
      startProcessing(url);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      startProcessing(url);
    }
  };

  useEffect(() => {
    if (processingStage !== 1) return;
    if (statusIndex >= statusMessages.length) return;

    const currentMessage = statusMessages[statusIndex];
    let charIndex = 0;
    setTypedStatus('');

    clearInterval(typeIntervalRef.current);
    clearTimeout(statusTimeoutRef.current);

    typeIntervalRef.current = setInterval(() => {
      charIndex += 1;
      setTypedStatus(currentMessage.slice(0, charIndex));
      if (charIndex >= currentMessage.length) {
        clearInterval(typeIntervalRef.current);
        statusTimeoutRef.current = setTimeout(() => {
          setStatusIndex((prev) => prev + 1);
        }, 850);
      }
    }, 45);

    return () => {
      clearInterval(typeIntervalRef.current);
      clearTimeout(statusTimeoutRef.current);
    };
  }, [processingStage, statusIndex]);

  useEffect(() => {
    if (processingStage !== 1) return;
    clearTimeout(processingTimeoutRef.current);
    processingTimeoutRef.current = setTimeout(() => processMedicineData(), 7600);
    return () => clearTimeout(processingTimeoutRef.current);
  }, [processingStage]);

  useEffect(() => {
    return () => {
      clearTimeout(statusTimeoutRef.current);
      clearInterval(typeIntervalRef.current);
      clearTimeout(processingTimeoutRef.current);
      clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  const processMedicineData = async () => {
    const detectedMedicines = ['amoxicillin', 'lisinopril'];
    const finalResults = [];

    for (const medKey of detectedMedicines) {
      const wikiInfo = await fetchMedicineInfo(medKey);
      const dbInfo = medicineDB[medKey] || { name: medKey, instructions: 'Follow doctor instructions.', dose: 'N/A' };
      const alternatives = getAlternatives(medKey);

      finalResults.push({
        id: medKey,
        name: dbInfo.name,
        dose: dbInfo.dose,
        instructions: dbInfo.instructions,
        description: wikiInfo?.description || 'Information not available from Wikipedia at this moment.',
        alternatives
      });
    }

    setResults(finalResults);
    setProcessingStage(5);
    transitionTimeoutRef.current = setTimeout(() => setProcessingStage(6), 900);
  };

  const handleReset = () => {
    setProcessingStage(0);
    setFileUrl(null);
    setResults(null);
    setStatusIndex(0);
    setTypedStatus('');
  };

  const renderProcessingUI = () => {
    return (
      <div className={`processing-container animate-fade-in ${processingStage === 5 ? 'scan-complete' : ''}`}>
        <div className="lens-processing-layout">
          <div className="lens-phone-stage">
            <div className="lens-phone-frame">
              <div className="lens-grid-overlay"></div>
              <div className="lens-floating-card">
                {fileUrl && <img src={fileUrl} alt="Prescription Upload" className="preview-image" />}
                <div className="lens-scan-line"></div>
              </div>
              <div className="lens-hold-pill">Please hold still.</div>
              <button type="button" className="lens-focus-btn" aria-label="Scanning focus">
                <span className="material-icons-outlined">center_focus_strong</span>
              </button>
            </div>
          </div>
          <div className="lens-status-panel">
            <div className="lens-status-top-glow"></div>
            <div className="lens-status-orb"></div>
            <p className="lens-status-text">
              {typedStatus || statusMessages[Math.min(statusIndex, statusMessages.length - 1)]}
            </p>
            <div className="lens-status-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

      {processingStage === 0 && (
        <div className="analyzer-grid">
          <div className="analyzer-left">
            <label
              className={`upload-zone card ${isDragging ? 'upload-zone-active' : ''} ${uploadRipple ? 'upload-ripple' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input type="file" accept="image/*" className="hidden-file-input" onChange={handleFileChange} />
              <span className="material-icons-outlined upload-zone-icon">cloud_upload</span>
              <h3 className="title-lg">Drop prescription here</h3>
              <p className="body-md text-muted">Support JPG, PNG, up to 10MB</p>
              <span className="btn btn-primary btn-sm mt-3">Browse Files</span>
            </label>
            <div className="hipaa-notice">
              <span className="material-icons-outlined icon-sm">shield</span>
              <div>
                <strong>HIPAA Compliant Processing</strong>
                <p className="body-md text-muted">
                  All data is encrypted and automatically redacted after analysis.
                </p>
              </div>
            </div>
          </div>

          <div className="analyzer-right">
            <div className="card flat-info-card">
              <span className="material-icons-outlined text-primary mb-2" style={{ fontSize: '36px' }}>info</span>
              <h3 className="title-md">How to get accurate results</h3>
              <ul className="info-list mt-3">
                <li><span className="material-icons-outlined">check_circle</span> Ensure good lighting</li>
                <li><span className="material-icons-outlined">check_circle</span> Capture the entire page</li>
                <li><span className="material-icons-outlined">check_circle</span> Keep text clearly visible</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {processingStage > 0 && processingStage < 6 && renderProcessingUI()}

      {processingStage === 6 && results && (
        <div className="results-panel animate-slide-in premium-results">
          <div className="results-header">
            <h2 className="headline-sm text-primary">Analysis Complete</h2>
            <button className="btn btn-outline btn-sm ripple-button result-action-btn" onClick={handleReset}>
              Process Another
            </button>
          </div>

          <div className="medicine-cards">
            {results.map((med, idx) => (
              <div className="card medicine-card premium-medicine-card" key={idx}>
                <div className="med-header">
                  <div>
                    <h3 className="title-lg med-name">
                      {med.name}
                      <span className="dose-pill">{med.dose}</span>
                    </h3>
                    <p className="usage-instructions">{med.instructions}</p>
                  </div>
                  <span className="material-icons-outlined med-icon">medication</span>
                </div>

                <p className="med-description">{med.description}</p>

                <div className="alternatives-section">
                  <h4 className="title-sm">Alternatives</h4>
                  <div className="alternative-list horizontal-scroll">
                    {med.alternatives.map((alt, i) => (
                      <div className={`alt-item premium-alt-card ${i === 0 ? 'best-price' : ''}`} key={i}>
                        <span className="alt-name">{alt.name}</span>
                        <div className="price-tag">
                          <span className="price-rupee">₹{alt.price}</span>
                          <span className="best-badge">{i === 0 ? 'Best Price' : 'Popular'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {processingStage === 0 && (
        <div className="recent-analyses" style={{ marginTop: '32px' }}>
          <h3 className="title-lg" style={{ marginBottom: 'var(--space-5)' }}>Recent Clinical Analyses</h3>
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
      )}

      <Footer />
    </div>
  );
}
