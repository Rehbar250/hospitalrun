const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// ============================================================================
// EMBEDDED CLINICAL DATABASES
// ============================================================================

// ~50 known drug-drug interactions (generic names, lowercase)
const DRUG_INTERACTIONS = [
  // Blood thinners + NSAIDs
  { drug1: 'warfarin', drug2: 'aspirin', severity: 'CRITICAL', description: 'Increased risk of severe bleeding. Concurrent use requires close INR monitoring.' },
  { drug1: 'warfarin', drug2: 'ibuprofen', severity: 'CRITICAL', description: 'NSAIDs increase anticoagulant effect and bleeding risk significantly.' },
  { drug1: 'warfarin', drug2: 'naproxen', severity: 'HIGH', description: 'Increased bleeding risk due to antiplatelet effect of NSAIDs.' },
  { drug1: 'warfarin', drug2: 'diclofenac', severity: 'HIGH', description: 'Risk of GI bleeding and enhanced anticoagulation.' },
  { drug1: 'heparin', drug2: 'aspirin', severity: 'CRITICAL', description: 'Significantly increased hemorrhagic risk with concurrent use.' },
  
  // ACE inhibitors + Potassium
  { drug1: 'lisinopril', drug2: 'spironolactone', severity: 'HIGH', description: 'Risk of life-threatening hyperkalemia. Monitor potassium levels closely.' },
  { drug1: 'enalapril', drug2: 'spironolactone', severity: 'HIGH', description: 'Dual RAAS blockade increases hyperkalemia risk.' },
  { drug1: 'ramipril', drug2: 'potassium chloride', severity: 'HIGH', description: 'ACE inhibitors reduce potassium excretion; supplementation may cause hyperkalemia.' },
  
  // Statins + other drugs
  { drug1: 'simvastatin', drug2: 'erythromycin', severity: 'CRITICAL', description: 'CYP3A4 inhibition increases statin levels, risk of rhabdomyolysis.' },
  { drug1: 'atorvastatin', drug2: 'clarithromycin', severity: 'HIGH', description: 'Macrolide antibiotics increase statin exposure and myopathy risk.' },
  { drug1: 'simvastatin', drug2: 'amiodarone', severity: 'HIGH', description: 'Amiodarone inhibits statin metabolism; limit simvastatin to 20mg.' },
  { drug1: 'lovastatin', drug2: 'itraconazole', severity: 'CRITICAL', description: 'Azole antifungals dramatically increase statin levels.' },
  
  // Metformin interactions
  { drug1: 'metformin', drug2: 'contrast dye', severity: 'HIGH', description: 'Risk of lactic acidosis. Withhold metformin 48h before and after contrast.' },
  { drug1: 'metformin', drug2: 'alcohol', severity: 'MODERATE', description: 'Alcohol potentiates lactic acidosis risk with metformin.' },
  
  // SSRIs + MAOIs / Serotonergic
  { drug1: 'fluoxetine', drug2: 'phenelzine', severity: 'CRITICAL', description: 'Serotonin syndrome risk. SSRI + MAOI combination is contraindicated.' },
  { drug1: 'sertraline', drug2: 'tranylcypromine', severity: 'CRITICAL', description: 'Life-threatening serotonin syndrome. Allow 14-day washout.' },
  { drug1: 'fluoxetine', drug2: 'tramadol', severity: 'HIGH', description: 'Increased risk of serotonin syndrome and seizures.' },
  { drug1: 'paroxetine', drug2: 'tramadol', severity: 'HIGH', description: 'Serotonergic interaction; risk of serotonin syndrome.' },
  { drug1: 'sertraline', drug2: 'sumatriptan', severity: 'MODERATE', description: 'Potential serotonin syndrome with triptans + SSRIs.' },
  
  // Cardiac drugs
  { drug1: 'digoxin', drug2: 'amiodarone', severity: 'HIGH', description: 'Amiodarone increases digoxin levels by 70-100%. Reduce digoxin dose.' },
  { drug1: 'digoxin', drug2: 'verapamil', severity: 'HIGH', description: 'Verapamil increases digoxin serum concentration and toxicity risk.' },
  { drug1: 'metoprolol', drug2: 'verapamil', severity: 'HIGH', description: 'Additive cardiac depression; risk of severe bradycardia and heart block.' },
  { drug1: 'atenolol', drug2: 'diltiazem', severity: 'MODERATE', description: 'Risk of excessive bradycardia and AV block.' },
  { drug1: 'amlodipine', drug2: 'simvastatin', severity: 'MODERATE', description: 'Amlodipine increases simvastatin exposure. Limit simvastatin to 20mg.' },
  
  // Antibiotics
  { drug1: 'ciprofloxacin', drug2: 'theophylline', severity: 'HIGH', description: 'Fluoroquinolones inhibit theophylline metabolism; toxicity risk.' },
  { drug1: 'ciprofloxacin', drug2: 'tizanidine', severity: 'CRITICAL', description: 'Ciprofloxacin increases tizanidine levels 10-fold. Contraindicated.' },
  { drug1: 'metronidazole', drug2: 'alcohol', severity: 'HIGH', description: 'Disulfiram-like reaction: severe nausea, vomiting, flushing.' },
  { drug1: 'metronidazole', drug2: 'warfarin', severity: 'HIGH', description: 'Metronidazole potentiates warfarin anticoagulant effect.' },
  { drug1: 'trimethoprim', drug2: 'methotrexate', severity: 'CRITICAL', description: 'Both are folate antagonists; risk of severe pancytopenia.' },
  { drug1: 'rifampin', drug2: 'oral contraceptives', severity: 'HIGH', description: 'Rifampin induces metabolism, reducing contraceptive efficacy.' },
  
  // Pain medications
  { drug1: 'morphine', drug2: 'benzodiazepine', severity: 'CRITICAL', description: 'Combined CNS depression; risk of respiratory failure and death.' },
  { drug1: 'oxycodone', drug2: 'alprazolam', severity: 'CRITICAL', description: 'Opioid + benzodiazepine: FDA black box warning for respiratory depression.' },
  { drug1: 'fentanyl', drug2: 'diazepam', severity: 'CRITICAL', description: 'Extreme respiratory depression risk with combined use.' },
  { drug1: 'codeine', drug2: 'promethazine', severity: 'HIGH', description: 'Additive CNS/respiratory depression, especially in children.' },
  { drug1: 'tramadol', drug2: 'carbamazepine', severity: 'MODERATE', description: 'Carbamazepine reduces tramadol efficacy via enzyme induction.' },
  
  // Diabetes medications
  { drug1: 'glipizide', drug2: 'fluconazole', severity: 'HIGH', description: 'Azole antifungals inhibit sulfonylurea metabolism; hypoglycemia risk.' },
  { drug1: 'insulin', drug2: 'propranolol', severity: 'MODERATE', description: 'Beta-blockers mask hypoglycemia symptoms and prolong episodes.' },
  { drug1: 'metformin', drug2: 'cimetidine', severity: 'MODERATE', description: 'Cimetidine reduces metformin renal clearance by 50%.' },
  
  // Lithium interactions
  { drug1: 'lithium', drug2: 'ibuprofen', severity: 'HIGH', description: 'NSAIDs reduce lithium clearance; risk of toxicity.' },
  { drug1: 'lithium', drug2: 'hydrochlorothiazide', severity: 'HIGH', description: 'Thiazide diuretics reduce lithium clearance significantly.' },
  { drug1: 'lithium', drug2: 'lisinopril', severity: 'HIGH', description: 'ACE inhibitors decrease lithium excretion; toxicity risk.' },
  
  // Miscellaneous high-impact
  { drug1: 'clopidogrel', drug2: 'omeprazole', severity: 'HIGH', description: 'Omeprazole inhibits CYP2C19, reducing clopidogrel activation by 45%.' },
  { drug1: 'sildenafil', drug2: 'nitroglycerin', severity: 'CRITICAL', description: 'Severe hypotension. PDE5 inhibitors + nitrates are contraindicated.' },
  { drug1: 'potassium', drug2: 'spironolactone', severity: 'HIGH', description: 'Potassium-sparing diuretic + potassium supplement = hyperkalemia.' },
  { drug1: 'allopurinol', drug2: 'azathioprine', severity: 'CRITICAL', description: 'Allopurinol inhibits azathioprine metabolism; risk of severe myelosuppression.' },
  { drug1: 'phenytoin', drug2: 'valproic acid', severity: 'HIGH', description: 'Complex interaction: valproate displaces phenytoin from binding proteins.' },
  { drug1: 'carbamazepine', drug2: 'erythromycin', severity: 'HIGH', description: 'Erythromycin inhibits carbamazepine metabolism; toxicity risk.' },
  { drug1: 'theophylline', drug2: 'cimetidine', severity: 'MODERATE', description: 'Cimetidine reduces theophylline clearance by 30-50%.' },
  { drug1: 'cyclosporine', drug2: 'ketoconazole', severity: 'HIGH', description: 'Azole antifungals increase cyclosporine levels; nephrotoxicity risk.' },
];

// Allergy → drug class mapping
const DRUG_ALLERGY_MAP = {
  'penicillin': ['amoxicillin', 'ampicillin', 'penicillin', 'piperacillin', 'nafcillin', 'oxacillin', 'dicloxacillin', 'augmentin', 'amoxiclav'],
  'sulfa': ['sulfamethoxazole', 'trimethoprim-sulfamethoxazole', 'bactrim', 'sulfasalazine', 'dapsone', 'celecoxib', 'furosemide', 'hydrochlorothiazide'],
  'aspirin': ['aspirin', 'ibuprofen', 'naproxen', 'diclofenac', 'ketorolac', 'indomethacin', 'piroxicam', 'meloxicam'],
  'nsaid': ['ibuprofen', 'naproxen', 'diclofenac', 'ketorolac', 'aspirin', 'indomethacin', 'piroxicam', 'celecoxib'],
  'cephalosporin': ['cephalexin', 'cefazolin', 'ceftriaxone', 'cefuroxime', 'cefixime', 'ceftazidime', 'cefepime'],
  'latex': ['latex'],
  'iodine': ['contrast dye', 'povidone-iodine', 'amiodarone'],
  'morphine': ['morphine', 'codeine', 'hydrocodone', 'oxycodone', 'fentanyl', 'meperidine', 'tramadol'],
  'codeine': ['codeine', 'hydrocodone', 'oxycodone', 'morphine', 'dihydrocodeine'],
  'egg': ['propofol', 'influenza vaccine'],
  'fluoroquinolone': ['ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'ofloxacin', 'norfloxacin'],
  'tetracycline': ['doxycycline', 'tetracycline', 'minocycline', 'tigecycline'],
  'macrolide': ['erythromycin', 'azithromycin', 'clarithromycin'],
  'ace inhibitor': ['lisinopril', 'enalapril', 'ramipril', 'captopril', 'benazepril', 'fosinopril'],
  'statin': ['atorvastatin', 'simvastatin', 'rosuvastatin', 'lovastatin', 'pravastatin', 'fluvastatin'],
};

// Lab reference ranges (~30 common tests)
const LAB_REFERENCE_RANGES = {
  // Complete Blood Count (CBC)
  'hemoglobin': { min: 12.0, max: 17.5, unit: 'g/dL', category: 'CBC', fullName: 'Hemoglobin' },
  'hematocrit': { min: 36, max: 52, unit: '%', category: 'CBC', fullName: 'Hematocrit' },
  'wbc': { min: 4000, max: 11000, unit: '/µL', category: 'CBC', fullName: 'White Blood Cell Count' },
  'rbc': { min: 4.2, max: 6.1, unit: 'M/µL', category: 'CBC', fullName: 'Red Blood Cell Count' },
  'platelet': { min: 150000, max: 400000, unit: '/µL', category: 'CBC', fullName: 'Platelet Count' },
  'mcv': { min: 80, max: 100, unit: 'fL', category: 'CBC', fullName: 'Mean Corpuscular Volume' },
  'mch': { min: 27, max: 33, unit: 'pg', category: 'CBC', fullName: 'Mean Corpuscular Hemoglobin' },
  
  // Liver Function Tests (LFT)
  'alt': { min: 7, max: 56, unit: 'U/L', category: 'LFT', fullName: 'Alanine Aminotransferase (ALT/SGPT)' },
  'ast': { min: 10, max: 40, unit: 'U/L', category: 'LFT', fullName: 'Aspartate Aminotransferase (AST/SGOT)' },
  'alp': { min: 44, max: 147, unit: 'U/L', category: 'LFT', fullName: 'Alkaline Phosphatase (ALP)' },
  'bilirubin': { min: 0.1, max: 1.2, unit: 'mg/dL', category: 'LFT', fullName: 'Total Bilirubin' },
  'albumin': { min: 3.5, max: 5.5, unit: 'g/dL', category: 'LFT', fullName: 'Albumin' },
  'total protein': { min: 6.0, max: 8.3, unit: 'g/dL', category: 'LFT', fullName: 'Total Protein' },
  
  // Renal Function Tests (RFT)
  'creatinine': { min: 0.7, max: 1.3, unit: 'mg/dL', category: 'RFT', fullName: 'Serum Creatinine' },
  'bun': { min: 7, max: 20, unit: 'mg/dL', category: 'RFT', fullName: 'Blood Urea Nitrogen (BUN)' },
  'urea': { min: 15, max: 45, unit: 'mg/dL', category: 'RFT', fullName: 'Blood Urea' },
  'uric acid': { min: 3.0, max: 7.0, unit: 'mg/dL', category: 'RFT', fullName: 'Uric Acid' },
  'gfr': { min: 90, max: 120, unit: 'mL/min', category: 'RFT', fullName: 'Glomerular Filtration Rate (eGFR)' },
  
  // Lipid Panel
  'total cholesterol': { min: 0, max: 200, unit: 'mg/dL', category: 'Lipid', fullName: 'Total Cholesterol' },
  'ldl': { min: 0, max: 100, unit: 'mg/dL', category: 'Lipid', fullName: 'LDL Cholesterol' },
  'hdl': { min: 40, max: 200, unit: 'mg/dL', category: 'Lipid', fullName: 'HDL Cholesterol' },
  'triglycerides': { min: 0, max: 150, unit: 'mg/dL', category: 'Lipid', fullName: 'Triglycerides' },
  
  // Thyroid Function
  'tsh': { min: 0.4, max: 4.0, unit: 'mIU/L', category: 'Thyroid', fullName: 'Thyroid Stimulating Hormone' },
  't3': { min: 80, max: 200, unit: 'ng/dL', category: 'Thyroid', fullName: 'Triiodothyronine (T3)' },
  't4': { min: 5.0, max: 12.0, unit: 'µg/dL', category: 'Thyroid', fullName: 'Thyroxine (T4)' },
  
  // Blood Sugar
  'fasting glucose': { min: 70, max: 100, unit: 'mg/dL', category: 'Metabolic', fullName: 'Fasting Blood Glucose' },
  'hba1c': { min: 4.0, max: 5.7, unit: '%', category: 'Metabolic', fullName: 'Glycated Hemoglobin (HbA1c)' },
  'random glucose': { min: 70, max: 140, unit: 'mg/dL', category: 'Metabolic', fullName: 'Random Blood Glucose' },
  
  // Electrolytes
  'sodium': { min: 136, max: 145, unit: 'mEq/L', category: 'Electrolytes', fullName: 'Serum Sodium' },
  'potassium': { min: 3.5, max: 5.0, unit: 'mEq/L', category: 'Electrolytes', fullName: 'Serum Potassium' },
  'calcium': { min: 8.5, max: 10.5, unit: 'mg/dL', category: 'Electrolytes', fullName: 'Serum Calcium' },
  'chloride': { min: 98, max: 106, unit: 'mEq/L', category: 'Electrolytes', fullName: 'Serum Chloride' },
  'magnesium': { min: 1.7, max: 2.2, unit: 'mg/dL', category: 'Electrolytes', fullName: 'Serum Magnesium' },
};

// Symptom keyword extraction patterns
const SYMPTOM_PATTERNS = [
  { pattern: /\b(fever|febrile|pyrexia|high temperature)\b/gi, symptom: 'Fever', icd: 'R50.9' },
  { pattern: /\b(headache|cephalgia|head pain|migraine)\b/gi, symptom: 'Headache', icd: 'R51' },
  { pattern: /\b(cough|coughing|tussis)\b/gi, symptom: 'Cough', icd: 'R05' },
  { pattern: /\b(chest pain|angina|thoracic pain|chest discomfort)\b/gi, symptom: 'Chest Pain', icd: 'R07.9' },
  { pattern: /\b(shortness of breath|dyspnea|breathless|sob|difficulty breathing)\b/gi, symptom: 'Dyspnea', icd: 'R06.0' },
  { pattern: /\b(nausea|nauseated|feeling sick)\b/gi, symptom: 'Nausea', icd: 'R11.0' },
  { pattern: /\b(vomiting|emesis|throwing up)\b/gi, symptom: 'Vomiting', icd: 'R11.1' },
  { pattern: /\b(diarrhea|diarrhoea|loose stools|watery stools)\b/gi, symptom: 'Diarrhea', icd: 'R19.7' },
  { pattern: /\b(abdominal pain|stomach ache|belly pain|epigastric pain)\b/gi, symptom: 'Abdominal Pain', icd: 'R10.9' },
  { pattern: /\b(fatigue|tiredness|lethargy|malaise|exhaustion)\b/gi, symptom: 'Fatigue', icd: 'R53.83' },
  { pattern: /\b(dizziness|dizzy|vertigo|lightheaded)\b/gi, symptom: 'Dizziness', icd: 'R42' },
  { pattern: /\b(back pain|lumbago|lower back pain|backache)\b/gi, symptom: 'Back Pain', icd: 'M54.5' },
  { pattern: /\b(joint pain|arthralgia|joint swelling)\b/gi, symptom: 'Joint Pain', icd: 'M25.50' },
  { pattern: /\b(swelling|edema|oedema|swollen)\b/gi, symptom: 'Edema', icd: 'R60.9' },
  { pattern: /\b(rash|skin eruption|dermatitis|urticaria|hives)\b/gi, symptom: 'Skin Rash', icd: 'R21' },
  { pattern: /\b(sore throat|pharyngitis|throat pain)\b/gi, symptom: 'Sore Throat', icd: 'J02.9' },
  { pattern: /\b(runny nose|rhinorrhea|nasal discharge|nasal congestion)\b/gi, symptom: 'Rhinorrhea', icd: 'R09.81' },
  { pattern: /\b(weight loss|losing weight|cachexia|wasting)\b/gi, symptom: 'Weight Loss', icd: 'R63.4' },
  { pattern: /\b(insomnia|sleepless|sleep disorder|difficulty sleeping)\b/gi, symptom: 'Insomnia', icd: 'G47.0' },
  { pattern: /\b(anxiety|anxious|panic|nervous)\b/gi, symptom: 'Anxiety', icd: 'F41.9' },
  { pattern: /\b(depression|depressed|low mood|sadness)\b/gi, symptom: 'Depression', icd: 'F32.9' },
  { pattern: /\b(palpitation|heart racing|tachycardia|irregular heartbeat)\b/gi, symptom: 'Palpitations', icd: 'R00.2' },
  { pattern: /\b(hypertension|high blood pressure|elevated bp)\b/gi, symptom: 'Hypertension', icd: 'I10' },
  { pattern: /\b(diabetes|diabetic|hyperglycemia|high blood sugar)\b/gi, symptom: 'Diabetes', icd: 'E11.9' },
  { pattern: /\b(anemia|anaemia|low hemoglobin)\b/gi, symptom: 'Anemia', icd: 'D64.9' },
  { pattern: /\b(seizure|convulsion|epilepsy|fits)\b/gi, symptom: 'Seizure', icd: 'R56.9' },
  { pattern: /\b(blurred vision|visual disturbance|vision loss)\b/gi, symptom: 'Visual Disturbance', icd: 'H53.8' },
  { pattern: /\b(urinary frequency|dysuria|burning micturition|uti)\b/gi, symptom: 'Urinary Symptoms', icd: 'R30.0' },
  { pattern: /\b(constipation|difficulty passing stool)\b/gi, symptom: 'Constipation', icd: 'K59.0' },
  { pattern: /\b(wheezing|bronchospasm|asthma)\b/gi, symptom: 'Wheezing', icd: 'R06.2' },
];

// Medication name patterns for NLP
const MEDICATION_PATTERNS = [
  /\b(paracetamol|acetaminophen|tylenol)\b/gi,
  /\b(ibuprofen|advil|motrin)\b/gi,
  /\b(amoxicillin|augmentin)\b/gi,
  /\b(metformin|glucophage)\b/gi,
  /\b(atorvastatin|lipitor)\b/gi,
  /\b(omeprazole|prilosec)\b/gi,
  /\b(amlodipine|norvasc)\b/gi,
  /\b(metoprolol|lopressor)\b/gi,
  /\b(lisinopril|zestril)\b/gi,
  /\b(losartan|cozaar)\b/gi,
  /\b(aspirin)\b/gi,
  /\b(ciprofloxacin|cipro)\b/gi,
  /\b(azithromycin|zithromax)\b/gi,
  /\b(prednisolone|prednisone)\b/gi,
  /\b(insulin)\b/gi,
  /\b(salbutamol|albuterol|ventolin)\b/gi,
  /\b(diazepam|valium)\b/gi,
  /\b(pantoprazole|protonix)\b/gi,
  /\b(clopidogrel|plavix)\b/gi,
  /\b(warfarin|coumadin)\b/gi,
  /\b(furosemide|lasix)\b/gi,
  /\b(gabapentin|neurontin)\b/gi,
  /\b(tramadol|ultram)\b/gi,
  /\b(doxycycline)\b/gi,
  /\b(cetirizine|zyrtec)\b/gi,
  /\b(ranitidine|zantac)\b/gi,
  /\b(hydrochlorothiazide|hctz)\b/gi,
  /\b(simvastatin|zocor)\b/gi,
  /\b(levothyroxine|synthroid)\b/gi,
  /\b(ceftriaxone|rocephin)\b/gi,
];

// Clinical entity patterns
const CLINICAL_ENTITY_PATTERNS = [
  { pattern: /\b(type [12] diabetes|t[12]dm|diabetes mellitus)\b/gi, entity: 'Type 2 Diabetes Mellitus', type: 'condition' },
  { pattern: /\b(coronary artery disease|cad|ischemic heart disease)\b/gi, entity: 'Coronary Artery Disease', type: 'condition' },
  { pattern: /\b(copd|chronic obstructive pulmonary disease)\b/gi, entity: 'COPD', type: 'condition' },
  { pattern: /\b(chronic kidney disease|ckd|renal failure)\b/gi, entity: 'Chronic Kidney Disease', type: 'condition' },
  { pattern: /\b(heart failure|chf|congestive heart failure)\b/gi, entity: 'Heart Failure', type: 'condition' },
  { pattern: /\b(pneumonia|lung infection)\b/gi, entity: 'Pneumonia', type: 'condition' },
  { pattern: /\b(myocardial infarction|heart attack|mi|stemi|nstemi)\b/gi, entity: 'Myocardial Infarction', type: 'condition' },
  { pattern: /\b(stroke|cerebrovascular accident|cva)\b/gi, entity: 'Stroke', type: 'condition' },
  { pattern: /\b(fracture|broken bone)\b/gi, entity: 'Fracture', type: 'condition' },
  { pattern: /\b(surgery|surgical|operation|procedure)\b/gi, entity: 'Surgical Procedure', type: 'procedure' },
  { pattern: /\b(ecg|electrocardiogram|ekg)\b/gi, entity: 'ECG', type: 'procedure' },
  { pattern: /\b(x-ray|xray|radiograph)\b/gi, entity: 'X-Ray', type: 'procedure' },
  { pattern: /\b(mri|magnetic resonance)\b/gi, entity: 'MRI', type: 'procedure' },
  { pattern: /\b(ct scan|computed tomography)\b/gi, entity: 'CT Scan', type: 'procedure' },
  { pattern: /\b(ultrasound|usg|sonography)\b/gi, entity: 'Ultrasound', type: 'procedure' },
];


// ============================================================================
// ENDPOINT 1: Check Prescription for Drug Interactions & Allergy Conflicts
// ============================================================================
router.post('/check-prescription', async (req, res, next) => {
  try {
    const { medicineNames, patientId } = req.body;
    
    if (!medicineNames || !Array.isArray(medicineNames) || medicineNames.length === 0) {
      return res.status(400).json({ error: 'medicineNames array is required.' });
    }
    
    const alerts = [];
    const normalizedMeds = medicineNames.map(m => m.toLowerCase().trim());
    
    // 1. Check drug-drug interactions
    for (let i = 0; i < normalizedMeds.length; i++) {
      for (let j = i + 1; j < normalizedMeds.length; j++) {
        const med1 = normalizedMeds[i];
        const med2 = normalizedMeds[j];
        
        const interaction = DRUG_INTERACTIONS.find(di =>
          (di.drug1 === med1 && di.drug2 === med2) ||
          (di.drug1 === med2 && di.drug2 === med1) ||
          med1.includes(di.drug1) && med2.includes(di.drug2) ||
          med1.includes(di.drug2) && med2.includes(di.drug1)
        );
        
        if (interaction) {
          alerts.push({
            type: 'DRUG_INTERACTION',
            severity: interaction.severity,
            title: `Drug Interaction: ${medicineNames[i]} ↔ ${medicineNames[j]}`,
            description: interaction.description,
            drugs: [medicineNames[i], medicineNames[j]],
          });
        }
      }
    }
    
    // 2. Check allergy conflicts if patientId provided
    if (patientId) {
      const patient = await req.prisma.patient.findUnique({
        where: { id: parseInt(patientId) },
        select: { allergies: true, firstName: true, lastName: true },
      });
      
      if (patient && patient.allergies) {
        const patientAllergies = patient.allergies.toLowerCase().split(/[,;]+/).map(a => a.trim()).filter(Boolean);
        
        for (const allergy of patientAllergies) {
          const conflictDrugs = DRUG_ALLERGY_MAP[allergy] || [];
          
          for (const med of normalizedMeds) {
            const isConflict = conflictDrugs.some(cd => med.includes(cd) || cd.includes(med));
            if (isConflict) {
              alerts.push({
                type: 'ALLERGY_CONFLICT',
                severity: 'CRITICAL',
                title: `Allergy Conflict: ${med} ↔ ${allergy} allergy`,
                description: `Patient ${patient.firstName} ${patient.lastName} has a documented "${allergy}" allergy. The prescribed medication "${med}" belongs to a conflicting drug class.`,
                drug: med,
                allergy: allergy,
              });
            }
          }
          
          // Also check partial matches against all known allergy maps
          for (const [allergyKey, conflictList] of Object.entries(DRUG_ALLERGY_MAP)) {
            if (allergy.includes(allergyKey) || allergyKey.includes(allergy)) {
              for (const med of normalizedMeds) {
                const isConflict = conflictList.some(cd => med.includes(cd) || cd.includes(med));
                if (isConflict && !alerts.some(a => a.drug === med && a.allergy === allergy)) {
                  alerts.push({
                    type: 'ALLERGY_CONFLICT',
                    severity: 'CRITICAL',
                    title: `Allergy Conflict: ${med} ↔ ${allergy} allergy`,
                    description: `Patient has a documented "${allergy}" allergy which may cross-react with "${med}".`,
                    drug: med,
                    allergy: allergy,
                  });
                }
              }
            }
          }
        }
      }
    }
    
    // Sort by severity
    const severityOrder = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };
    alerts.sort((a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99));
    
    res.json({
      alerts,
      totalAlerts: alerts.length,
      hasCritical: alerts.some(a => a.severity === 'CRITICAL'),
      summary: alerts.length === 0
        ? 'No drug interactions or allergy conflicts detected.'
        : `Found ${alerts.length} alert(s): ${alerts.filter(a => a.severity === 'CRITICAL').length} critical, ${alerts.filter(a => a.severity === 'HIGH').length} high, ${alerts.filter(a => a.severity === 'MODERATE').length} moderate.`,
    });
  } catch (err) { next(err); }
});


// ============================================================================
// ENDPOINT 2: Check Vitals for Abnormalities
// ============================================================================
router.post('/check-vitals', async (req, res, next) => {
  try {
    const { temperature, bloodPress, pulseRate, spo2, weight, patientId } = req.body;
    const alerts = [];
    let riskScore = 0;
    
    // Temperature analysis
    if (temperature != null) {
      const temp = parseFloat(temperature);
      if (temp >= 40.0) {
        alerts.push({ parameter: 'Temperature', value: `${temp}°C`, severity: 'CRITICAL', message: 'Hyperpyrexia (≥40°C) — immediate intervention required. Risk of febrile seizures and organ damage.' });
        riskScore += 30;
      } else if (temp >= 38.5) {
        alerts.push({ parameter: 'Temperature', value: `${temp}°C`, severity: 'HIGH', message: 'High-grade fever (38.5-40°C). Investigate source of infection; consider antipyretics and blood cultures.' });
        riskScore += 20;
      } else if (temp >= 38.0) {
        alerts.push({ parameter: 'Temperature', value: `${temp}°C`, severity: 'MODERATE', message: 'Low-grade fever (38.0-38.5°C). Monitor trend and consider investigation if persistent.' });
        riskScore += 10;
      } else if (temp < 35.0) {
        alerts.push({ parameter: 'Temperature', value: `${temp}°C`, severity: 'HIGH', message: 'Hypothermia (<35°C). Assess for sepsis, exposure, or endocrine dysfunction.' });
        riskScore += 20;
      }
    }
    
    // Blood Pressure analysis
    if (bloodPress) {
      const bpParts = bloodPress.split('/');
      if (bpParts.length === 2) {
        const systolic = parseInt(bpParts[0]);
        const diastolic = parseInt(bpParts[1]);
        
        if (systolic >= 180 || diastolic >= 120) {
          alerts.push({ parameter: 'Blood Pressure', value: bloodPress, severity: 'CRITICAL', message: 'Hypertensive crisis (≥180/120 mmHg). Immediate evaluation for end-organ damage required.' });
          riskScore += 30;
        } else if (systolic >= 140 || diastolic >= 90) {
          alerts.push({ parameter: 'Blood Pressure', value: bloodPress, severity: 'HIGH', message: 'Stage 2 Hypertension (≥140/90 mmHg). Medication review and lifestyle counseling recommended.' });
          riskScore += 15;
        } else if (systolic >= 130 || diastolic >= 80) {
          alerts.push({ parameter: 'Blood Pressure', value: bloodPress, severity: 'MODERATE', message: 'Elevated BP / Stage 1 Hypertension (130-139/80-89 mmHg). Lifestyle modifications advised.' });
          riskScore += 5;
        } else if (systolic < 90 || diastolic < 60) {
          alerts.push({ parameter: 'Blood Pressure', value: bloodPress, severity: 'HIGH', message: 'Hypotension (<90/60 mmHg). Assess for dehydration, bleeding, or cardiogenic shock.' });
          riskScore += 20;
        }
      }
    }
    
    // Pulse Rate analysis
    if (pulseRate != null) {
      const pulse = parseInt(pulseRate);
      if (pulse > 150) {
        alerts.push({ parameter: 'Pulse Rate', value: `${pulse} bpm`, severity: 'CRITICAL', message: 'Severe tachycardia (>150 bpm). Rule out SVT, VT, or hemodynamic instability.' });
        riskScore += 25;
      } else if (pulse > 120) {
        alerts.push({ parameter: 'Pulse Rate', value: `${pulse} bpm`, severity: 'HIGH', message: 'Significant tachycardia (120-150 bpm). Investigate fever, pain, anemia, or anxiety.' });
        riskScore += 15;
      } else if (pulse > 100) {
        alerts.push({ parameter: 'Pulse Rate', value: `${pulse} bpm`, severity: 'MODERATE', message: 'Tachycardia (100-120 bpm). Monitor and assess contributing factors.' });
        riskScore += 5;
      } else if (pulse < 50) {
        alerts.push({ parameter: 'Pulse Rate', value: `${pulse} bpm`, severity: 'HIGH', message: 'Severe bradycardia (<50 bpm). Evaluate for heart block or medication effect (beta-blockers).' });
        riskScore += 20;
      } else if (pulse < 60) {
        alerts.push({ parameter: 'Pulse Rate', value: `${pulse} bpm`, severity: 'MODERATE', message: 'Bradycardia (50-60 bpm). May be normal in athletes; otherwise investigate.' });
        riskScore += 5;
      }
    }
    
    // SPO2 analysis
    if (spo2 != null) {
      const oxygenSat = parseInt(spo2);
      if (oxygenSat < 90) {
        alerts.push({ parameter: 'SPO2', value: `${oxygenSat}%`, severity: 'CRITICAL', message: 'Severe hypoxemia (<90% SPO2). Immediate oxygen supplementation required. Consider ABG analysis.' });
        riskScore += 30;
      } else if (oxygenSat < 94) {
        alerts.push({ parameter: 'SPO2', value: `${oxygenSat}%`, severity: 'HIGH', message: 'Hypoxemia (90-93% SPO2). Supplemental oxygen and respiratory assessment needed.' });
        riskScore += 15;
      } else if (oxygenSat < 95) {
        alerts.push({ parameter: 'SPO2', value: `${oxygenSat}%`, severity: 'MODERATE', message: 'Borderline oxygen saturation (94% SPO2). Monitor closely, especially in COPD patients.' });
        riskScore += 5;
      }
    }
    
    res.json({
      alerts,
      riskScore: Math.min(riskScore, 100),
      overallStatus: riskScore >= 50 ? 'CRITICAL' : riskScore >= 25 ? 'HIGH' : riskScore > 0 ? 'MODERATE' : 'NORMAL',
      summary: alerts.length === 0
        ? 'All vital signs are within normal limits.'
        : `${alerts.length} abnormality(ies) detected with overall risk score of ${Math.min(riskScore, 100)}/100.`,
    });
  } catch (err) { next(err); }
});


// ============================================================================
// ENDPOINT 3: Predictive Readmission Risk
// ============================================================================
router.get('/readmission-risk/:patientId', async (req, res, next) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    const patient = await req.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        vitals: { orderBy: { createdAt: 'desc' }, take: 20 },
        appointments: { orderBy: { dateTime: 'desc' }, take: 30 },
        prescriptions: { include: { items: { include: { medicine: true } } }, take: 10 },
        labReports: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    
    if (!patient) return res.status(404).json({ error: 'Patient not found.' });
    
    const factors = [];
    let totalScore = 0;
    
    // Factor 1: Age (older = higher risk)
    const age = patient.dateOfBirth
      ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / 31557600000)
      : 0;
    
    if (age >= 75) {
      factors.push({ factor: 'Advanced Age', detail: `${age} years old (≥75)`, score: 18, maxScore: 18 });
      totalScore += 18;
    } else if (age >= 65) {
      factors.push({ factor: 'Elderly', detail: `${age} years old (65-74)`, score: 12, maxScore: 18 });
      totalScore += 12;
    } else if (age >= 50) {
      factors.push({ factor: 'Middle-aged', detail: `${age} years old (50-64)`, score: 5, maxScore: 18 });
      totalScore += 5;
    } else {
      factors.push({ factor: 'Age', detail: `${age} years old (<50)`, score: 0, maxScore: 18 });
    }
    
    // Factor 2: Number of recent visits (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
    const recentVisits = patient.appointments.filter(a => new Date(a.dateTime) > ninetyDaysAgo).length;
    
    if (recentVisits >= 5) {
      factors.push({ factor: 'Frequent Visits', detail: `${recentVisits} visits in last 90 days (≥5)`, score: 15, maxScore: 15 });
      totalScore += 15;
    } else if (recentVisits >= 3) {
      factors.push({ factor: 'Multiple Visits', detail: `${recentVisits} visits in last 90 days (3-4)`, score: 8, maxScore: 15 });
      totalScore += 8;
    } else {
      factors.push({ factor: 'Visit Frequency', detail: `${recentVisits} visits in last 90 days`, score: 0, maxScore: 15 });
    }
    
    // Factor 3: Abnormal vitals count
    let abnormalVitalsCount = 0;
    for (const v of patient.vitals) {
      if (v.temperature > 38.0 || v.temperature < 35.0) abnormalVitalsCount++;
      if (v.spo2 < 95) abnormalVitalsCount++;
      if (v.pulseRate > 100 || v.pulseRate < 60) abnormalVitalsCount++;
      const bp = v.bloodPress.split('/');
      if (bp.length === 2) {
        if (parseInt(bp[0]) >= 140 || parseInt(bp[1]) >= 90 || parseInt(bp[0]) < 90) abnormalVitalsCount++;
      }
    }
    
    if (abnormalVitalsCount >= 5) {
      factors.push({ factor: 'Abnormal Vitals', detail: `${abnormalVitalsCount} abnormal readings detected (≥5)`, score: 18, maxScore: 18 });
      totalScore += 18;
    } else if (abnormalVitalsCount >= 2) {
      factors.push({ factor: 'Abnormal Vitals', detail: `${abnormalVitalsCount} abnormal readings detected (2-4)`, score: 10, maxScore: 18 });
      totalScore += 10;
    } else {
      factors.push({ factor: 'Vitals Stability', detail: `${abnormalVitalsCount} abnormal readings`, score: 0, maxScore: 18 });
    }
    
    // Factor 4: Chronic conditions from medical history
    const history = (patient.medicalHistory || '').toLowerCase();
    const chronicConditions = [];
    const chronicKeywords = [
      { keyword: 'diabetes', condition: 'Diabetes' },
      { keyword: 'hypertension', condition: 'Hypertension' },
      { keyword: 'heart failure', condition: 'Heart Failure' },
      { keyword: 'copd', condition: 'COPD' },
      { keyword: 'asthma', condition: 'Asthma' },
      { keyword: 'kidney', condition: 'Kidney Disease' },
      { keyword: 'liver', condition: 'Liver Disease' },
      { keyword: 'cancer', condition: 'Cancer' },
      { keyword: 'stroke', condition: 'Previous Stroke' },
      { keyword: 'cardiac', condition: 'Cardiac Disease' },
    ];
    
    for (const ck of chronicKeywords) {
      if (history.includes(ck.keyword)) {
        chronicConditions.push(ck.condition);
      }
    }
    
    if (chronicConditions.length >= 3) {
      factors.push({ factor: 'Multiple Comorbidities', detail: chronicConditions.join(', '), score: 20, maxScore: 20 });
      totalScore += 20;
    } else if (chronicConditions.length >= 1) {
      factors.push({ factor: 'Chronic Conditions', detail: chronicConditions.join(', '), score: 10, maxScore: 20 });
      totalScore += 10;
    } else {
      factors.push({ factor: 'Comorbidities', detail: 'None identified in medical history', score: 0, maxScore: 20 });
    }
    
    // Factor 5: Active prescriptions (polypharmacy)
    const activePrescriptions = patient.prescriptions.length;
    const totalMedications = patient.prescriptions.reduce((acc, p) => acc + (p.items?.length || 0), 0);
    
    if (totalMedications >= 8) {
      factors.push({ factor: 'Polypharmacy', detail: `${totalMedications} medications across ${activePrescriptions} prescriptions (≥8)`, score: 14, maxScore: 14 });
      totalScore += 14;
    } else if (totalMedications >= 5) {
      factors.push({ factor: 'Multiple Medications', detail: `${totalMedications} medications across ${activePrescriptions} prescriptions (5-7)`, score: 7, maxScore: 14 });
      totalScore += 7;
    } else {
      factors.push({ factor: 'Medications', detail: `${totalMedications} medications`, score: 0, maxScore: 14 });
    }
    
    // Factor 6: Pending/abnormal lab results
    const completedLabs = patient.labReports.filter(r => r.status === 'COMPLETED' && r.result);
    const pendingLabs = patient.labReports.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
    
    if (pendingLabs.length >= 3) {
      factors.push({ factor: 'Pending Investigations', detail: `${pendingLabs.length} lab tests pending`, score: 15, maxScore: 15 });
      totalScore += 15;
    } else if (pendingLabs.length >= 1) {
      factors.push({ factor: 'Lab Follow-up', detail: `${pendingLabs.length} lab test(s) pending`, score: 5, maxScore: 15 });
      totalScore += 5;
    } else {
      factors.push({ factor: 'Lab Status', detail: `${completedLabs.length} completed, no pending`, score: 0, maxScore: 15 });
    }
    
    // Cap at 100
    const finalScore = Math.min(totalScore, 100);
    
    // Generate recommendations
    const recommendations = [];
    if (finalScore >= 70) {
      recommendations.push('Schedule a follow-up appointment within 48 hours post-discharge');
      recommendations.push('Arrange home health nurse visit within first week');
      recommendations.push('Ensure medication reconciliation is complete before discharge');
      recommendations.push('Provide patient education materials for self-care management');
    } else if (finalScore >= 40) {
      recommendations.push('Schedule follow-up within 7 days post-discharge');
      recommendations.push('Review and simplify medication regimen if possible');
      recommendations.push('Provide clear discharge instructions with red-flag symptoms');
    } else if (finalScore >= 20) {
      recommendations.push('Standard follow-up in 2-4 weeks');
      recommendations.push('Ensure patient understands medication instructions');
    } else {
      recommendations.push('Routine follow-up as planned');
    }
    
    if (chronicConditions.length > 0) recommendations.push(`Continue management for: ${chronicConditions.join(', ')}`);
    if (totalMedications >= 5) recommendations.push('Consider pharmacist consultation for medication review');
    
    res.json({
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        patientId: patient.patientId,
        age,
      },
      riskScore: finalScore,
      riskLevel: finalScore >= 70 ? 'CRITICAL' : finalScore >= 40 ? 'HIGH' : finalScore >= 20 ? 'MODERATE' : 'LOW',
      factors,
      recommendations,
      summary: `Readmission risk score: ${finalScore}/100 (${finalScore >= 70 ? 'Critical' : finalScore >= 40 ? 'High' : finalScore >= 20 ? 'Moderate' : 'Low'} risk). Based on ${factors.length} clinical factors analyzed.`,
    });
  } catch (err) { next(err); }
});


// ============================================================================
// ENDPOINT 4: Lab Anomaly Detection
// ============================================================================
router.get('/lab-anomalies', async (req, res, next) => {
  try {
    const reports = await req.prisma.labReport.findMany({
      where: { status: 'COMPLETED', result: { not: null } },
      include: { patient: true, doctor: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    
    const analyzedReports = [];
    
    for (const report of reports) {
      const anomalies = [];
      const resultText = (report.result || '').toLowerCase();
      const testNameLower = report.testName.toLowerCase();
      
      // Try to match against known lab tests
      for (const [testKey, range] of Object.entries(LAB_REFERENCE_RANGES)) {
        // Check if the test name or result mentions this test
        if (testNameLower.includes(testKey) || resultText.includes(testKey) || resultText.includes(range.fullName.toLowerCase())) {
          // Extract numeric value near this test mention
          const patterns = [
            new RegExp(`${testKey}[:\\s]*([\\d.]+)`, 'i'),
            new RegExp(`([\\d.]+)\\s*${range.unit.replace('/', '\\/')}`, 'i'),
            new RegExp(`(?:result|value|level)[:\\s]*([\\d.]+)`, 'i'),
          ];
          
          let value = null;
          for (const pat of patterns) {
            const match = resultText.match(pat) || report.result.match(pat);
            if (match) {
              value = parseFloat(match[1]);
              break;
            }
          }
          
          // If no specific pattern matched, try to find any number in the result
          if (value === null && testNameLower.includes(testKey)) {
            const numMatch = report.result.match(/[\d.]+/);
            if (numMatch) value = parseFloat(numMatch[0]);
          }
          
          if (value !== null && !isNaN(value)) {
            let severity = null;
            let deviation = 0;
            
            if (value < range.min) {
              deviation = ((range.min - value) / range.min) * 100;
              severity = deviation > 30 ? 'CRITICAL' : deviation > 15 ? 'HIGH' : 'MODERATE';
            } else if (value > range.max) {
              deviation = ((value - range.max) / range.max) * 100;
              severity = deviation > 30 ? 'CRITICAL' : deviation > 15 ? 'HIGH' : 'MODERATE';
            }
            
            if (severity) {
              anomalies.push({
                testParameter: range.fullName,
                value,
                unit: range.unit,
                referenceMin: range.min,
                referenceMax: range.max,
                category: range.category,
                severity,
                deviation: Math.round(deviation),
                direction: value < range.min ? 'LOW' : 'HIGH',
                message: value < range.min
                  ? `${range.fullName} is below normal range (${value} ${range.unit} vs ${range.min}-${range.max} ${range.unit})`
                  : `${range.fullName} is above normal range (${value} ${range.unit} vs ${range.min}-${range.max} ${range.unit})`,
              });
            }
          }
        }
      }
      
      if (anomalies.length > 0) {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MODERATE: 2 };
        anomalies.sort((a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99));
        
        analyzedReports.push({
          reportId: report.reportId,
          id: report.id,
          testName: report.testName,
          result: report.result,
          testDate: report.testDate,
          patient: {
            id: report.patient.id,
            name: `${report.patient.firstName} ${report.patient.lastName}`,
            patientId: report.patient.patientId,
          },
          doctor: report.doctor ? {
            name: `Dr. ${report.doctor.firstName} ${report.doctor.lastName}`,
          } : null,
          anomalies,
          maxSeverity: anomalies[0]?.severity || 'LOW',
          anomalyCount: anomalies.length,
        });
      }
    }
    
    // Sort reports by max severity
    const severityOrder = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };
    analyzedReports.sort((a, b) => (severityOrder[a.maxSeverity] || 99) - (severityOrder[b.maxSeverity] || 99));
    
    res.json({
      reports: analyzedReports,
      totalAnomalies: analyzedReports.reduce((sum, r) => sum + r.anomalyCount, 0),
      criticalCount: analyzedReports.filter(r => r.maxSeverity === 'CRITICAL').length,
      highCount: analyzedReports.filter(r => r.maxSeverity === 'HIGH').length,
      moderateCount: analyzedReports.filter(r => r.maxSeverity === 'MODERATE').length,
    });
  } catch (err) { next(err); }
});


// ============================================================================
// ENDPOINT 5: NLP Analysis of Clinical Notes
// ============================================================================
router.post('/analyze-notes', async (req, res, next) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Clinical note text is required.' });
    }
    
    // Extract symptoms
    const symptoms = [];
    const seenSymptoms = new Set();
    for (const sp of SYMPTOM_PATTERNS) {
      const matches = text.match(sp.pattern);
      if (matches && !seenSymptoms.has(sp.symptom)) {
        seenSymptoms.add(sp.symptom);
        symptoms.push({
          symptom: sp.symptom,
          icdCode: sp.icd,
          matchedText: matches[0],
          confidence: matches.length > 1 ? 'HIGH' : 'MODERATE',
        });
      }
    }
    
    // Extract medications mentioned
    const medications = [];
    const seenMeds = new Set();
    for (const mp of MEDICATION_PATTERNS) {
      const matches = text.match(mp);
      if (matches) {
        for (const m of matches) {
          const normalized = m.toLowerCase();
          if (!seenMeds.has(normalized)) {
            seenMeds.add(normalized);
            medications.push({ name: m, normalized });
          }
        }
      }
    }
    
    // Extract clinical entities
    const entities = [];
    const seenEntities = new Set();
    for (const ep of CLINICAL_ENTITY_PATTERNS) {
      const matches = text.match(ep.pattern);
      if (matches && !seenEntities.has(ep.entity)) {
        seenEntities.add(ep.entity);
        entities.push({
          entity: ep.entity,
          type: ep.type,
          matchedText: matches[0],
        });
      }
    }
    
    // Build structured summary
    const structuredData = {
      symptoms,
      medications,
      entities,
      icdCodes: symptoms.map(s => ({ code: s.icdCode, description: s.symptom })),
      wordCount: text.split(/\s+/).length,
      sentenceCount: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
    };
    
    res.json({
      ...structuredData,
      summary: `Extracted ${symptoms.length} symptom(s), ${medications.length} medication(s), and ${entities.length} clinical entity(ies) from ${structuredData.wordCount} words.`,
    });
  } catch (err) { next(err); }
});


// ============================================================================
// ENDPOINT 6: Clinical Intelligence Dashboard Stats
// ============================================================================
router.get('/dashboard', async (req, res, next) => {
  try {
    // Get recent vitals with abnormalities
    const recentVitals = await req.prisma.vitals.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { patient: true },
    });
    
    let abnormalVitals = 0;
    for (const v of recentVitals) {
      if (v.temperature > 38.0 || v.temperature < 35.0) abnormalVitals++;
      else if (v.spo2 < 95) abnormalVitals++;
      else if (v.pulseRate > 100 || v.pulseRate < 60) abnormalVitals++;
      else {
        const bp = v.bloodPress.split('/');
        if (bp.length === 2 && (parseInt(bp[0]) >= 140 || parseInt(bp[1]) >= 90 || parseInt(bp[0]) < 90)) abnormalVitals++;
      }
    }
    
    // Get completed lab reports count
    const completedLabsWithResults = await req.prisma.labReport.count({
      where: { status: 'COMPLETED', result: { not: null } },
    });
    
    // Get patient count for risk analysis
    const totalPatients = await req.prisma.patient.count();
    
    // Get recent prescriptions count
    const recentPrescriptions = await req.prisma.prescription.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    });
    
    res.json({
      abnormalVitalsCount: abnormalVitals,
      totalVitalsChecked: recentVitals.length,
      completedLabReports: completedLabsWithResults,
      totalPatients,
      recentPrescriptions,
      aiModulesActive: 4,
    });
  } catch (err) { next(err); }
});


// ============================================================================
// ENDPOINT 7: Appointment Insights (AI Clinical Assist)
// ============================================================================
router.get('/appointment-insights/:appointmentId', async (req, res, next) => {
  try {
    const appointmentId = parseInt(req.params.appointmentId);
    const appointment = await req.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            vitals: { orderBy: { createdAt: 'desc' }, take: 5 },
            prescriptions: true,
          }
        },
        doctor: {
          include: {
            appointments: true,
          }
        }
      }
    });

    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });

    // Calculate simulated No-Show Risk
    let noShowScore = 15; // baseline
    const patient = appointment.patient;
    const age = patient.dateOfBirth
      ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / 31557600000)
      : 30;

    // Older patients have lower no-show risk, younger/middle-aged have slightly higher
    if (age < 30) noShowScore += 15;
    else if (age > 70) noShowScore -= 10;

    // Late afternoon appointments have higher no-show risk
    const hour = new Date(appointment.dateTime).getHours();
    if (hour >= 16) noShowScore += 20;

    // Patients with chronic history or active prescriptions have lower no-show (higher compliance)
    const history = (patient.medicalHistory || '').toLowerCase();
    if (history.includes('diabetes') || history.includes('hypertension') || history.includes('heart')) {
      noShowScore -= 10;
    }
    if (patient.prescriptions.length > 3) {
      noShowScore -= 5;
    }
    
    // Ensure boundary
    noShowScore = Math.max(5, Math.min(noShowScore, 95));

    // Calculate Doctor schedule load for that day
    const aptDateStr = new Date(appointment.dateTime).toDateString();
    const doctorLoad = appointment.doctor.appointments.filter(a => 
      new Date(a.dateTime).toDateString() === aptDateStr
    ).length;

    // Generate clinical recommendations for the visit
    const checkupPlan = [];
    if (history.includes('diabetes')) {
      checkupPlan.push('Review fasting blood glucose levels and HbA1c history.');
      checkupPlan.push('Check patient adherence to Metformin/insulin regimen.');
    }
    if (history.includes('hypertension')) {
      checkupPlan.push('Perform double-check blood pressure measurement.');
      checkupPlan.push('Assess for symptoms of headache or vision changes.');
    }
    if (history.includes('heart') || history.includes('coronary')) {
      checkupPlan.push('Schedule ECG if not performed in the last 30 days.');
      checkupPlan.push('Review cardiovascular symptoms (chest pain, dyspnea).');
    }
    
    // Check vitals history
    const latestVital = patient.vitals[0];
    if (latestVital) {
      if (latestVital.spo2 < 95) {
        checkupPlan.push(`Monitor SpO2 trend (last recorded low at ${latestVital.spo2}%).`);
      }
      if (latestVital.temperature > 38.0) {
        checkupPlan.push(`Assess for resolving/new infection symptoms (fever recorded at ${latestVital.temperature}°C).`);
      }
    }

    if (checkupPlan.length === 0) {
      checkupPlan.push('Routine wellness exam checkup.');
      checkupPlan.push('Update family history and clinical note records.');
    }

    res.json({
      noShowRisk: noShowScore,
      doctorDailyLoad: doctorLoad,
      doctorLoadStatus: doctorLoad > 5 ? 'HIGH' : doctorLoad > 3 ? 'MODERATE' : 'OPTIMAL',
      checkupPlan,
      suggestedDurationMins: noShowScore > 50 ? 30 : 20,
    });
  } catch (err) { next(err); }
});

module.exports = router;
