/** Public presentation adapter. No credentials, records or browser persistence. */
export function createDisconnectedSource() {
  return Object.freeze({
    connection: Object.freeze({status:'not_connected', source:null, lastVerifiedAt:null}),
    async readModule(module, {signal} = {}) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      return {module, status:'not_connected', records:[], metrics:null, exceptions:null,
        coverage:null, authoritative:false, asOf:null};
    },
    async readReport(period, {signal} = {}) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      return {period, status:'not_connected', metrics:null, coverage:null,
        authoritative:false, asOf:null};
    }
  });
}
