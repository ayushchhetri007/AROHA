const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private currentRole: string = 'patient';
  private currentUserId: string = 'usr-patient-1';
  private currentToken: string = '';

  setAuthHeaders(role: string, userId: string, token?: string) {
    this.currentRole = role;
    this.currentUserId = userId;
    if (token !== undefined) {
      this.currentToken = token;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-demo-role': this.currentRole,
      'x-user-id': this.currentUserId,
      ...(this.currentToken ? { 'Authorization': `Bearer ${this.currentToken}` } : { 'Authorization': `Bearer demo-token-${this.currentUserId}` }),
      ...(options.headers as Record<string, string> || {})
    };

    const url = `${API_BASE}${endpoint}`;
    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err: any) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  }

  // Auth
  getMe() {
    return this.request<any>('/auth/me');
  }

  getProfile() {
    return this.request<any>('/profile');
  }

  login(identifier: string, role?: string, password?: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, role, password })
    });
  }

  sendPatientOtp(patientId: string) {
    return this.request<any>('/auth/patient/send-otp', {
      method: 'POST',
      body: JSON.stringify({ patientId })
    });
  }

  verifyPatientOtp(patientId: string, otp: string) {
    return this.request<any>('/auth/patient/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ patientId, otp })
    });
  }

  forgotPatientIdSendOtp(phone: string) {
    return this.request<any>('/auth/patient/forgot-id/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  }

  forgotPatientIdVerifyOtp(recoveryToken: string, otp: string) {
    return this.request<any>('/auth/patient/forgot-id/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ recoveryToken, otp })
    });
  }

  register(data: any) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  saveAssessment(data: any) {
    return this.request<any>('/clinical/assessments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  getAssessments(patientId?: string) {
    if (!patientId) return Promise.resolve([]);
    return this.request<any[]>(`/clinical/assessments/${encodeURIComponent(patientId)}`);
  }

  switchDemoRole(role: string) {
    return this.request<any>('/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  }

  getDemoAccounts() {
    return this.request<any[]>('/auth/demo-accounts');
  }

  // Facilities
  getFacilities(params: { district?: string; type?: string; emergency?: boolean; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.district) query.set('district', params.district);
    if (params.type) query.set('type', params.type);
    if (params.emergency) query.set('emergency', '1');
    if (params.search) query.set('search', params.search);
    return this.request<any[]>(`/facilities?${query.toString()}`);
  }

  getFacilityById(id: string) {
    return this.request<any>(`/facilities/${id}`);
  }

  // Appointments & Queues
  getAppointments(patientId?: string, status?: string) {
    const params = new URLSearchParams();
    if (patientId) params.append('patient_id', patientId);
    if (status) params.append('status', status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/appointments${qs}`);
  }

  cancelAppointment(id: string) {
    return this.request<any>(`/appointments/${id}/cancel`, {
      method: 'PATCH'
    });
  }

  createAppointment(data: any) {
    return this.request<any>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  getQueue(facilityId: string = 'fac-phc-shirwal', scope?: 'all') {
    const scopeParam = scope ? `&scope=${scope}` : '';
    return this.request<any>(`/queues?facility_id=${facilityId}${scopeParam}`);
  }

  callNextToken(facilityId: string = 'fac-phc-shirwal') {
    return this.request<any>('/queues/call-next', {
      method: 'POST',
      body: JSON.stringify({ facility_id: facilityId })
    });
  }

  updateTokenStatus(id: string, status: string) {
    return this.request<any>(`/queues/tokens/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Clinical & Longitudinal EHR
  getPatientTimeline(patientId: string = 'pat-meera') {
    return this.request<any>(`/clinical/timeline/${patientId}`);
  }

  createConsultation(data: any) {
    return this.request<any>('/clinical/consultations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Inter-Facility Referrals
  getReferrals(params: { status?: string; facility_id?: string; patient_id?: string } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.facility_id) query.set('facility_id', params.facility_id);
    if (params.patient_id) query.set('patient_id', params.patient_id);
    return this.request<any[]>(`/referrals?${query.toString()}`);
  }

  getReferralById(id: string) {
    return this.request<any>(`/referrals/${id}`);
  }

  updateReferralStatus(id: string, status: string, notes?: string, actor_role?: string) {
    return this.request<any>(`/referrals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, outcome_notes: notes, actor_role })
    });
  }

  // Medicine Inventory
  searchMedicines(query?: string, district?: string) {
    const p = new URLSearchParams();
    if (query) p.set('query', query);
    if (district) p.set('district', district);
    return this.request<any[]>(`/medicines?${p.toString()}`);
  }

  updateMedicineStock(id: string, quantity: number) {
    return this.request<any>(`/medicines/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock_quantity: quantity })
    });
  }

  // Facility Inventory & Capability Search
  searchInventory(type: 'medicine' | 'equipment' | 'specialist' | 'service', query: string) {
    const p = new URLSearchParams({ type, query });
    return this.request<{ type: string; query: string; results: any[] }>(`/inventory/search?${p.toString()}`);
  }

  addEquipment(data: { facility_id: string; equipment_name: string; category: string; quantity_available?: number }) {
    return this.request<any>('/hospitals/equipment', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateEquipment(id: string, data: { quantity_available?: number; is_available?: number }) {
    return this.request<any>(`/hospitals/equipment/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Frontline Worker (ASHA / ANM)
  getCommunitySummary() {
    return this.request<any>('/frontline/community');
  }

  getHighRiskRoster() {
    return this.request<any>('/frontline/high-risk-roster');
  }

  recordHomeVisit(data: any) {
    return this.request<any>('/frontline/home-visits', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  syncOfflineVisits(visits: any[]) {
    return this.request<any>('/frontline/sync-offline', {
      method: 'POST',
      body: JSON.stringify({ visits })
    });
  }

  // Analytics & Command Center
  getDistrictAnalytics(district: string = 'Satara') {
    return this.request<any>(`/analytics/district?district=${district}`);
  }

  getStateAnalytics() {
    return this.request<any>('/analytics/state');
  }

  // AI Decision Support Triage
  getAiTriage(data: any) {
    return this.request<any>('/ai/triage', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  askHealthAssistant(question: string, language: string = 'en') {
    return this.request<any>('/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({ question, language })
    });
  }

  getGeminiSymptomTriage(symptomTags: string[], freeText: string, language: string = 'en') {
    return this.request<any>('/ai/symptom-triage', {
      method: 'POST',
      body: JSON.stringify({ symptomTags, freeText, language })
    });
  }

  // Grievance Redressal
  submitGrievance(data: any) {
    return this.request<any>('/grievances', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  getGrievances() {
    return this.request<any[]>('/grievances');
  }

  // Hospital Management Suite
  getHospitalOverview(facilityId: string = 'fac-dh-satara') {
    return this.request<any>(`/hospitals/overview?facility_id=${facilityId}`);
  }

  getWardsAndBeds(facilityId: string = 'fac-dh-satara') {
    return this.request<any>(`/hospitals/beds?facility_id=${facilityId}`);
  }

  updateBedStatus(bedId: string, status: string, patientId?: string | null, notes?: string) {
    return this.request<any>(`/hospitals/beds/${bedId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, current_patient_id: patientId, notes })
    });
  }

  getAdmissions(facilityId: string = 'fac-dh-satara', status?: string) {
    const query = new URLSearchParams({ facility_id: facilityId });
    if (status && status !== 'ALL') query.set('status', status);
    return this.request<any[]>(`/hospitals/admissions?${query.toString()}`);
  }

  createAdmission(data: any) {
    return this.request<any>('/hospitals/admissions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateAdmissionStatus(admissionId: string, status: string, wardId?: string, bedId?: string, notes?: string) {
    return this.request<any>(`/hospitals/admissions/${admissionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ward_id: wardId, bed_id: bedId, notes })
    });
  }

  dischargePatient(admissionId: string, data: any) {
    return this.request<any>(`/hospitals/admissions/${admissionId}/discharge`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  getHospitalStaff(facilityId: string = 'fac-dh-satara') {
    return this.request<any[]>(`/hospitals/staff?facility_id=${facilityId}`);
  }

  getFacilityNetwork() {
    return this.request<any>('/hospitals/network');
  }

  // FHIR Interoperability
  getFhirPatient(id: string = 'pat-meera') {
    return this.request<any>(`/fhir/Patient/${id}`);
  }

  getFhirBundle(patientId: string = 'pat-meera') {
    return this.request<any>(`/fhir/Bundle/${patientId}`);
  }

  getFhirResource(resourceType: string, patientId: string = 'pat-meera') {
    return this.request<any>(`/fhir/${resourceType}?patient=${patientId}`);
  }
}


export const api = new ApiClient();
export default api;
