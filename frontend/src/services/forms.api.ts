import api from './api';

export const formsApi = {
  getFormInstance: (accessId: string) =>
    api.get(`/forms/${accessId}`).then((r) => r.data),
  getPassengerSlot: (slotId: string) =>
    api.get(`/forms/slot/${slotId}`).then((r) => r.data),
  getFormSchema: (accessId: string) =>
    api.get(`/captures/${accessId}/schema`).then((r) => r.data),
  savePassenger: (slotId: string, answers: Record<string, unknown>) =>
    api.post(`/forms/slot/${slotId}`, { answers }).then((r) => r.data),
  getClientProposals: () =>
    api.get('/forms/my-proposals').then((r) => r.data),
};
