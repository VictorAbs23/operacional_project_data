import api from './api';

export const exportsApi = {
  download: (type: string, proposalId?: string) =>
    api.get('/exports', {
      params: { type, proposalId },
      responseType: 'blob',
    }).then((r) => {
      const disposition = r.headers['content-disposition'];
      const match = disposition?.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || `export_${type}_${new Date().toISOString().slice(0,10)}.csv`;
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }),
};
