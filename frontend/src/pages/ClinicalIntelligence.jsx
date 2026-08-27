import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';
import {
  Brain, ShieldAlert, Activity, FlaskConical, FileText,
  AlertTriangle, CheckCircle, XCircle, Search, Loader2,
  TrendingUp, Heart, Zap, Clipboard, ChevronRight,
  ArrowUpRight, ArrowDownRight, Info, Sparkles, Copy, Check
} from 'lucide-react';

const ciTabs = [
  { id: 'decision-support', label: 'Clinical Decision Support', icon: ShieldAlert },
  { id: 'readmission', label: 'Readmission Risk', icon: TrendingUp },
  { id: 'lab-anomalies', label: 'Lab Anomaly Detection', icon: FlaskConical },
  { id: 'nlp-notes', label: 'Clinical Notes NLP', icon: FileText },
];

export default function ClinicalIntelligence() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('decision-support');
  const [dashboardStats, setDashboardStats] = useState(null);

  useEffect(() => {
    api.getClinicalDashboard().then(setDashboardStats).catch(console.error);
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ci-header-icon">
              <Brain size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>AI Clinical Intelligence</h2>
              <p className="text-sm text-muted" style={{ marginTop: 2 }}>
                Real-time clinical decision support powered by intelligent algorithms
              </p>
            </div>
          </div>
        </div>
        {dashboardStats && (
          <div className="ci-header-stats">
            <div className="ci-header-stat">
              <span className="ci-header-stat-value">{dashboardStats.aiModulesActive}</span>
              <span className="ci-header-stat-label">AI Modules</span>
            </div>
            <div className="ci-header-stat">
              <span className="ci-header-stat-value">{dashboardStats.abnormalVitalsCount}</span>
              <span className="ci-header-stat-label">Vitals Alerts</span>
            </div>
            <div className="ci-header-stat">
              <span className="ci-header-stat-value">{dashboardStats.completedLabReports}</span>
              <span className="ci-header-stat-label">Labs Analyzed</span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Layout */}
      <div className="settings-layout" style={{ gridTemplateColumns: '240px 1fr' }}>
        <div className="settings-sidebar">
          {ciTabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'decision-support' && <DecisionSupportTab />}
          {activeTab === 'readmission' && <ReadmissionRiskTab />}
          {activeTab === 'lab-anomalies' && <LabAnomalyTab />}
          {activeTab === 'nlp-notes' && <NLPNotesTab />}
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// TAB 1: Clinical Decision Support
// ============================================================================
function DecisionSupportTab() {
  const toast = useToast();
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedMeds, setSelectedMeds] = useState([]);
  const [medSearch, setMedSearch] = useState('');
  const [prescriptionResult, setPrescriptionResult] = useState(null);
  const [checkingRx, setCheckingRx] = useState(false);

  // Vitals checker state
  const [vitalsForm, setVitalsForm] = useState({ temperature: '', bloodPress: '', pulseRate: '', spo2: '' });
  const [vitalsResult, setVitalsResult] = useState(null);
  const [checkingVitals, setCheckingVitals] = useState(false);

  useEffect(() => {
    api.getPatients('limit=200').then(d => setPatients(d.patients || [])).catch(console.error);
    api.getMedicines().then(setMedicines).catch(console.error);
  }, []);

  const addMedicine = (med) => {
    if (!selectedMeds.find(m => m.id === med.id)) {
      setSelectedMeds([...selectedMeds, med]);
    }
    setMedSearch('');
  };

  const removeMedicine = (medId) => {
    setSelectedMeds(selectedMeds.filter(m => m.id !== medId));
  };

  const checkPrescription = async () => {
    if (selectedMeds.length < 1) {
      toast.error('Select at least one medicine to check.');
      return;
    }
    setCheckingRx(true);
    setPrescriptionResult(null);
    try {
      const result = await api.checkPrescription({
        medicineNames: selectedMeds.map(m => m.name),
        patientId: selectedPatient || undefined,
      });
      setPrescriptionResult(result);
      if (result.hasCritical) {
        toast.error(`⚠️ CRITICAL alerts found! ${result.totalAlerts} issue(s) detected.`);
      } else if (result.totalAlerts > 0) {
        toast.warning(`${result.totalAlerts} alert(s) found. Review recommended.`);
      } else {
        toast.success('No drug interactions or allergy conflicts detected.');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCheckingRx(false);
    }
  };

  const checkVitalsAnalysis = async () => {
    const { temperature, bloodPress, pulseRate, spo2 } = vitalsForm;
    if (!temperature && !bloodPress && !pulseRate && !spo2) {
      toast.error('Enter at least one vital sign to analyze.');
      return;
    }
    setCheckingVitals(true);
    setVitalsResult(null);
    try {
      const result = await api.checkVitals(vitalsForm);
      setVitalsResult(result);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCheckingVitals(false);
    }
  };

  const filteredMeds = medSearch
    ? medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Prescription Interaction Checker */}
      <div className="card ci-card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={20} className="ci-icon-pulse" />
            Drug Interaction & Allergy Checker
          </h3>
        </div>
        <div className="card-body">
          <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
            Select a patient and medicines to check for potential drug-drug interactions and allergy conflicts in real-time.
          </p>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Patient (optional — enables allergy checking)</label>
              <select className="form-select" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                <option value="">— No patient selected —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientId}){p.allergies ? ` ⚠️ ${p.allergies}` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Medicines to Check</label>
            <div className="ci-med-chips">
              {selectedMeds.map(m => (
                <span key={m.id} className="ci-med-chip">
                  {m.name}
                  <button onClick={() => removeMedicine(m.id)} className="ci-med-chip-remove">×</button>
                </span>
              ))}
            </div>
            <div style={{ position: 'relative', marginTop: 8 }}>
              <div className="search-bar" style={{ width: '100%' }}>
                <Search size={16} />
                <input
                  placeholder="Search & add medicines..."
                  value={medSearch}
                  onChange={e => setMedSearch(e.target.value)}
                />
              </div>
              {filteredMeds.length > 0 && (
                <div className="ci-med-dropdown">
                  {filteredMeds.map(m => (
                    <button key={m.id} className="ci-med-dropdown-item" onClick={() => addMedicine(m)}>
                      <span>{m.name}</span>
                      <span className="text-sm text-muted">{m.category || 'General'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button className="btn btn-primary" onClick={checkPrescription} disabled={checkingRx} style={{ marginTop: 12 }}>
            {checkingRx ? <><Loader2 size={16} className="ci-spin" /> Analyzing...</> : <><Zap size={16} /> Check for Interactions</>}
          </button>

          {/* Results */}
          {prescriptionResult && (
            <div className="ci-results-container" style={{ marginTop: 20 }}>
              <div className={`ci-results-summary ${prescriptionResult.hasCritical ? 'critical' : prescriptionResult.totalAlerts > 0 ? 'warning' : 'safe'}`}>
                {prescriptionResult.totalAlerts === 0 ? (
                  <><CheckCircle size={20} /> <span>{prescriptionResult.summary}</span></>
                ) : (
                  <><AlertTriangle size={20} /> <span>{prescriptionResult.summary}</span></>
                )}
              </div>

              {prescriptionResult.alerts.map((alert, i) => (
                <div key={i} className={`ci-alert-card ${alert.severity.toLowerCase()}`} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="ci-alert-header">
                    <span className={`ci-severity-badge ${alert.severity.toLowerCase()}`}>
                      {alert.severity === 'CRITICAL' ? <XCircle size={14} /> : <AlertTriangle size={14} />}
                      {alert.severity}
                    </span>
                    <span className="ci-alert-type-badge">{alert.type === 'DRUG_INTERACTION' ? '💊 Drug Interaction' : '🚨 Allergy Conflict'}</span>
                  </div>
                  <h4 className="ci-alert-title">{alert.title}</h4>
                  <p className="ci-alert-desc">{alert.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vitals Analyzer */}
      <div className="card ci-card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={20} style={{ color: 'var(--danger)' }} />
            Real-Time Vitals Analyzer
          </h3>
        </div>
        <div className="card-body">
          <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
            Enter vital signs to get instant clinical analysis with severity-scored alerts and recommended actions.
          </p>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Temperature (°C)</label>
              <input type="number" step="0.1" placeholder="e.g. 38.5" className="form-input"
                value={vitalsForm.temperature} onChange={e => setVitalsForm({ ...vitalsForm, temperature: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Pressure (mmHg)</label>
              <input type="text" placeholder="e.g. 140/90" className="form-input"
                value={vitalsForm.bloodPress} onChange={e => setVitalsForm({ ...vitalsForm, bloodPress: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Pulse Rate (bpm)</label>
              <input type="number" placeholder="e.g. 110" className="form-input"
                value={vitalsForm.pulseRate} onChange={e => setVitalsForm({ ...vitalsForm, pulseRate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">SPO2 (%)</label>
              <input type="number" min="0" max="100" placeholder="e.g. 92" className="form-input"
                value={vitalsForm.spo2} onChange={e => setVitalsForm({ ...vitalsForm, spo2: e.target.value })} />
            </div>
          </div>

          <button className="btn btn-primary" onClick={checkVitalsAnalysis} disabled={checkingVitals} style={{ marginTop: 4 }}>
            {checkingVitals ? <><Loader2 size={16} className="ci-spin" /> Analyzing...</> : <><Heart size={16} /> Analyze Vitals</>}
          </button>

          {vitalsResult && (
            <div className="ci-results-container" style={{ marginTop: 20 }}>
              <div className={`ci-results-summary ${vitalsResult.overallStatus === 'CRITICAL' ? 'critical' : vitalsResult.overallStatus === 'HIGH' ? 'warning' : vitalsResult.overallStatus === 'MODERATE' ? 'moderate' : 'safe'}`}>
                {vitalsResult.overallStatus === 'NORMAL' ? (
                  <><CheckCircle size={20} /> <span>{vitalsResult.summary}</span></>
                ) : (
                  <><AlertTriangle size={20} /> <span>{vitalsResult.summary}</span></>
                )}
              </div>

              {vitalsResult.alerts.map((alert, i) => (
                <div key={i} className={`ci-alert-card ${alert.severity.toLowerCase()}`} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="ci-alert-header">
                    <span className={`ci-severity-badge ${alert.severity.toLowerCase()}`}>
                      {alert.severity === 'CRITICAL' ? <XCircle size={14} /> : <AlertTriangle size={14} />}
                      {alert.severity}
                    </span>
                    <span className="ci-alert-type-badge">📊 {alert.parameter}: {alert.value}</span>
                  </div>
                  <p className="ci-alert-desc">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// TAB 2: Readmission Risk Predictor
// ============================================================================
function ReadmissionRiskTab() {
  const toast = useToast();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.getPatients('limit=200').then(d => setPatients(d.patients || [])).catch(console.error);
  }, []);

  const analyzeRisk = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await api.getReadmissionRisk(selectedPatient);
      setResult(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'var(--danger)';
      case 'HIGH': return '#f97316';
      case 'MODERATE': return 'var(--warning)';
      case 'LOW': return 'var(--success)';
      default: return 'var(--gray-400)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card ci-card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} style={{ color: '#f97316' }} />
            Predictive Readmission Risk Assessment
          </h3>
        </div>
        <div className="card-body">
          <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
            Select a patient to calculate their 30-day readmission risk score based on clinical factors including age, visit frequency, vitals history, comorbidities, and polypharmacy.
          </p>

          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Select Patient</label>
              <select className="form-select" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                <option value="">— Select a patient —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientId})</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flexShrink: 0 }}>
              <button className="btn btn-primary" onClick={analyzeRisk} disabled={loading}>
                {loading ? <><Loader2 size={16} className="ci-spin" /> Calculating...</> : <><Sparkles size={16} /> Analyze Risk</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <>
          {/* Risk Gauge */}
          <div className="card ci-card">
            <div className="card-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div className="ci-risk-gauge-container">
                <svg className="ci-risk-gauge" viewBox="0 0 200 200" width="200" height="200">
                  <circle cx="100" cy="100" r="85" fill="none" stroke="var(--gray-200)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${85 * 2 * Math.PI * 0.75}`} strokeDashoffset="0"
                    transform="rotate(135, 100, 100)" />
                  <circle cx="100" cy="100" r="85" fill="none" stroke={riskColor(result.riskLevel)} strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${85 * 2 * Math.PI * 0.75}`}
                    strokeDashoffset={`${85 * 2 * Math.PI * 0.75 * (1 - result.riskScore / 100)}`}
                    transform="rotate(135, 100, 100)"
                    className="ci-risk-gauge-fill" />
                </svg>
                <div className="ci-risk-gauge-label">
                  <div className="ci-risk-score" style={{ color: riskColor(result.riskLevel) }}>{result.riskScore}</div>
                  <div className="ci-risk-max">/100</div>
                </div>
              </div>
              <div className={`ci-severity-badge large ${result.riskLevel.toLowerCase()}`} style={{ margin: '16px auto 0' }}>
                {result.riskLevel} RISK
              </div>
              <p className="text-sm text-muted" style={{ marginTop: 8 }}>
                {result.patient.name} ({result.patient.patientId}) · {result.patient.age} years old
              </p>
            </div>
          </div>

          {/* Risk Factors Breakdown */}
          <div className="card ci-card">
            <div className="card-header">
              <h3>Risk Factor Analysis</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.factors.map((f, i) => (
                  <div key={i} className="ci-factor-row">
                    <div className="ci-factor-info">
                      <span className="ci-factor-name">{f.factor}</span>
                      <span className="ci-factor-detail">{f.detail}</span>
                    </div>
                    <div className="ci-factor-bar-container">
                      <div className="ci-factor-bar-track">
                        <div className="ci-factor-bar-fill" style={{
                          width: `${(f.score / f.maxScore) * 100}%`,
                          background: f.score >= f.maxScore * 0.7 ? 'var(--danger)' : f.score >= f.maxScore * 0.4 ? '#f97316' : 'var(--success)',
                          animationDelay: `${i * 0.1}s`,
                        }} />
                      </div>
                      <span className="ci-factor-score">{f.score}/{f.maxScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="card ci-card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clipboard size={18} />
                Recommended Interventions
              </h3>
            </div>
            <div className="card-body">
              <div className="ci-recommendations">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="ci-recommendation-item">
                    <ChevronRight size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


// ============================================================================
// TAB 3: Lab Anomaly Detection
// ============================================================================
function LabAnomalyTab() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    loadAnomalies();
  }, []);

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      const result = await api.getLabAnomalies();
      setData(result);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = data?.reports?.filter(r => !severityFilter || r.maxSeverity === severityFilter) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Summary Stats */}
      {data && (
        <div className="ci-anomaly-stats">
          <div className="ci-anomaly-stat-card critical">
            <XCircle size={20} />
            <div>
              <div className="ci-anomaly-stat-value">{data.criticalCount}</div>
              <div className="ci-anomaly-stat-label">Critical</div>
            </div>
          </div>
          <div className="ci-anomaly-stat-card high">
            <AlertTriangle size={20} />
            <div>
              <div className="ci-anomaly-stat-value">{data.highCount}</div>
              <div className="ci-anomaly-stat-label">High</div>
            </div>
          </div>
          <div className="ci-anomaly-stat-card moderate">
            <Info size={20} />
            <div>
              <div className="ci-anomaly-stat-value">{data.moderateCount}</div>
              <div className="ci-anomaly-stat-label">Moderate</div>
            </div>
          </div>
          <div className="ci-anomaly-stat-card total">
            <FlaskConical size={20} />
            <div>
              <div className="ci-anomaly-stat-value">{data.totalAnomalies}</div>
              <div className="ci-anomaly-stat-label">Total Anomalies</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & List */}
      <div className="card ci-card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FlaskConical size={20} style={{ color: 'var(--warning)' }} />
            Anomalous Lab Results — Priority Queue
          </h3>
          <div className="flex gap-3">
            <select className="form-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ width: 160 }}>
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MODERATE">Moderate Only</option>
            </select>
            <button className="btn btn-outline btn-sm" onClick={loadAnomalies}>
              Refresh
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-spinner" style={{ padding: 40 }}><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-400)' }}>
              <FlaskConical size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p>No lab anomalies detected in completed reports.</p>
            </div>
          ) : (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.map((report, ri) => (
                <div key={report.id} className={`ci-lab-report-card ${report.maxSeverity.toLowerCase()}`} style={{ animationDelay: `${ri * 0.05}s` }}>
                  <div className="ci-lab-report-header">
                    <div>
                      <span style={{ color: 'var(--primary)', fontWeight: 700, marginRight: 8 }}>{report.reportId}</span>
                      <span className="font-semibold">{report.testName}</span>
                    </div>
                    <span className={`ci-severity-badge ${report.maxSeverity.toLowerCase()}`}>
                      {report.maxSeverity === 'CRITICAL' ? <XCircle size={12} /> : <AlertTriangle size={12} />}
                      {report.maxSeverity}
                    </span>
                  </div>
                  <div className="ci-lab-report-meta">
                    <span>👤 {report.patient.name} ({report.patient.patientId})</span>
                    {report.doctor && <span>🩺 {report.doctor.name}</span>}
                    <span>📅 {formatDate(report.testDate)}</span>
                  </div>

                  {/* Anomaly details */}
                  <div className="ci-anomaly-details">
                    {report.anomalies.map((a, ai) => (
                      <div key={ai} className="ci-anomaly-row">
                        <div className="ci-anomaly-info">
                          <span className="ci-anomaly-test-name">{a.testParameter}</span>
                          <span className="ci-anomaly-message">{a.message}</span>
                        </div>
                        <div className="ci-range-bar-container">
                          <div className="ci-range-bar">
                            <div className="ci-range-bar-normal"
                              style={{
                                left: `${Math.max(0, (a.referenceMin / (a.referenceMax * 1.5)) * 100)}%`,
                                width: `${Math.min(100, ((a.referenceMax - a.referenceMin) / (a.referenceMax * 1.5)) * 100)}%`,
                              }}
                            />
                            <div className={`ci-range-bar-marker ${a.direction.toLowerCase()}`}
                              style={{
                                left: `${Math.max(2, Math.min(98, (a.value / (a.referenceMax * 1.5)) * 100))}%`,
                              }}
                            />
                          </div>
                          <div className="ci-range-labels">
                            <span>{a.referenceMin} {a.unit}</span>
                            <span className={`ci-value-tag ${a.direction.toLowerCase()}`}>
                              {a.direction === 'HIGH' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                              {a.value} {a.unit}
                            </span>
                            <span>{a.referenceMax} {a.unit}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// TAB 4: Clinical Notes NLP
// ============================================================================
function NLPNotesTab() {
  const toast = useToast();
  const [noteText, setNoteText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const sampleNotes = [
    "Patient presents with persistent fever (38.9°C) for 3 days, associated with headache, fatigue, and dry cough. Has history of Type 2 Diabetes Mellitus controlled on Metformin 500mg BD. BP measured 148/92 mmHg. Currently on Atorvastatin 20mg for hyperlipidemia. Complains of joint pain in both knees. Assessment: Possible upper respiratory tract infection with uncontrolled hypertension. Plan: Start Azithromycin 500mg OD for 5 days, Paracetamol 650mg TDS, monitor blood glucose, and follow up ECG.",
    "72-year-old male admitted with chest pain radiating to left arm, shortness of breath, and palpitations since yesterday evening. Known case of coronary artery disease with previous CABG (2019). Current medications include Aspirin 75mg, Clopidogrel 75mg, Metoprolol 50mg, and Ramipril 5mg. ECG shows ST segment depression in leads V4-V6. Troponin I elevated at 2.4 ng/mL. Assessment: Acute coronary syndrome - NSTEMI. Plan: Heparin infusion, Nitroglycerin patch, urgent cardiology consultation.",
    "Young female (28 years) presents with recurrent episodes of anxiety, insomnia, and depression over the past 6 weeks. Reports weight loss of 5 kg. Denies suicidal ideation. No significant past medical history. On examination: tachycardia (pulse 108 bpm), tremor in hands, mild exophthalmos. TSH: 0.1 mIU/L, Free T4: 4.2 µg/dL. Assessment: Hyperthyroidism (likely Graves' disease) with secondary psychiatric symptoms. Plan: Start Carbimazole 15mg TDS, Propranolol 40mg BD, refer to endocrinology and psychiatry.",
  ];

  const analyzeNotes = async () => {
    if (!noteText.trim()) {
      toast.error('Please enter clinical notes to analyze.');
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const data = await api.analyzeNotes(noteText);
      setResult(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const copyStructured = () => {
    if (!result) return;
    const text = [
      '=== EXTRACTED CLINICAL DATA ===',
      '',
      '--- SYMPTOMS ---',
      ...result.symptoms.map(s => `• ${s.symptom} [${s.icdCode}] (${s.confidence})`),
      '',
      '--- ICD-10 CODES ---',
      ...result.icdCodes.map(c => `${c.code} — ${c.description}`),
      '',
      '--- MEDICATIONS ---',
      ...result.medications.map(m => `• ${m.name}`),
      '',
      '--- CLINICAL ENTITIES ---',
      ...result.entities.map(e => `• ${e.entity} [${e.type}]`),
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Structured data copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card ci-card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} style={{ color: 'var(--primary)' }} />
            Clinical Notes NLP Analyzer
          </h3>
        </div>
        <div className="card-body">
          <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
            Paste or type free-text clinical notes below. The NLP engine will extract symptoms, ICD-10 diagnosis codes, medications, and key clinical entities automatically.
          </p>

          {/* Sample notes */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ marginBottom: 8 }}>Quick Load Sample Notes:</label>
            <div className="ci-sample-notes">
              {sampleNotes.map((note, i) => (
                <button key={i} className="btn btn-outline btn-sm" onClick={() => setNoteText(note)}>
                  Sample {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Notes</label>
            <textarea
              className="form-textarea ci-notes-textarea"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              rows={8}
              placeholder="Enter or paste doctor's clinical notes here...&#10;&#10;Example: Patient presents with persistent fever, headache, and dry cough. Known diabetic on Metformin..."
            />
            <div className="text-sm text-muted" style={{ marginTop: 4 }}>
              {noteText.split(/\s+/).filter(Boolean).length} words · {noteText.split(/[.!?]+/).filter(s => s.trim()).length} sentences
            </div>
          </div>

          <button className="btn btn-primary" onClick={analyzeNotes} disabled={analyzing} style={{ marginTop: 8 }}>
            {analyzing ? <><Loader2 size={16} className="ci-spin" /> Extracting...</> : <><Sparkles size={16} /> Analyze Notes</>}
          </button>
        </div>
      </div>

      {/* NLP Results */}
      {result && (
        <>
          <div className="ci-nlp-summary-bar">
            <span><Sparkles size={16} /> {result.summary}</span>
            <button className="btn btn-outline btn-sm" onClick={copyStructured}>
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Structured Data</>}
            </button>
          </div>

          <div className="ci-nlp-grid">
            {/* Symptoms */}
            <div className="card ci-card ci-nlp-section">
              <div className="card-header">
                <h3 style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🩺 Extracted Symptoms ({result.symptoms.length})
                </h3>
              </div>
              <div className="card-body" style={{ padding: result.symptoms.length ? 12 : 24 }}>
                {result.symptoms.length === 0 ? (
                  <p className="text-sm text-muted" style={{ textAlign: 'center' }}>No symptoms detected</p>
                ) : (
                  <div className="ci-nlp-items">
                    {result.symptoms.map((s, i) => (
                      <div key={i} className="ci-nlp-item" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="ci-nlp-item-main">
                          <span className="ci-nlp-item-name">{s.symptom}</span>
                          <span className={`ci-confidence-badge ${s.confidence.toLowerCase()}`}>{s.confidence}</span>
                        </div>
                        <span className="ci-nlp-item-code">ICD-10: {s.icdCode}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ICD-10 Codes */}
            <div className="card ci-card ci-nlp-section">
              <div className="card-header">
                <h3 style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🏷️ ICD-10 Diagnosis Codes ({result.icdCodes.length})
                </h3>
              </div>
              <div className="card-body" style={{ padding: result.icdCodes.length ? 12 : 24 }}>
                {result.icdCodes.length === 0 ? (
                  <p className="text-sm text-muted" style={{ textAlign: 'center' }}>No diagnosis codes detected</p>
                ) : (
                  <div className="ci-nlp-items">
                    {result.icdCodes.map((c, i) => (
                      <div key={i} className="ci-nlp-item" style={{ animationDelay: `${i * 0.05}s` }}>
                        <span className="ci-icd-code">{c.code}</span>
                        <span className="ci-nlp-item-name" style={{ flex: 1 }}>{c.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Medications */}
            <div className="card ci-card ci-nlp-section">
              <div className="card-header">
                <h3 style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  💊 Medications Mentioned ({result.medications.length})
                </h3>
              </div>
              <div className="card-body" style={{ padding: result.medications.length ? 12 : 24 }}>
                {result.medications.length === 0 ? (
                  <p className="text-sm text-muted" style={{ textAlign: 'center' }}>No medications detected</p>
                ) : (
                  <div className="ci-nlp-med-chips">
                    {result.medications.map((m, i) => (
                      <span key={i} className="ci-nlp-med-chip" style={{ animationDelay: `${i * 0.04}s` }}>
                        💊 {m.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Clinical Entities */}
            <div className="card ci-card ci-nlp-section">
              <div className="card-header">
                <h3 style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔬 Clinical Entities ({result.entities.length})
                </h3>
              </div>
              <div className="card-body" style={{ padding: result.entities.length ? 12 : 24 }}>
                {result.entities.length === 0 ? (
                  <p className="text-sm text-muted" style={{ textAlign: 'center' }}>No clinical entities detected</p>
                ) : (
                  <div className="ci-nlp-items">
                    {result.entities.map((e, i) => (
                      <div key={i} className="ci-nlp-item" style={{ animationDelay: `${i * 0.05}s` }}>
                        <span className="ci-nlp-item-name">{e.entity}</span>
                        <span className={`ci-entity-type-badge ${e.type}`}>{e.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
