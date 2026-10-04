/** Contract for an approved private Studio OS API. This file contains no credentials. */
const STATUSES=new Set(['ready','not_connected','unavailable','unauthorised','stale','partial']);
const MODULES=new Set(['today','customers','classes','memberships','sales','staff','operations','retention','reports','management','system']);
const PERIODS=new Set(['Daily','Weekly','Monthly']);

function unavailable(kind,key,status='unavailable'){
  return { [kind]:key,status,authoritative:false,asOf:null,coverage:null,metrics:null,
    ...(kind==='module'?{records:[],exceptions:null}:{}) };
}
function validate(response,kind,key){
  if(!response||!STATUSES.has(response.status))return unavailable(kind,key);
  if(response.status==='ready' && (response.authoritative!==true||!response.asOf||!response.coverage))
    return unavailable(kind,key);
  if(response.status!=='ready')return {...unavailable(kind,key,response.status),asOf:response.asOf||null,coverage:response.coverage||null};
  return {...response,[kind]:key};
}

/**
 * Use only inside an authenticated owner UI. The server must enforce session,
 * role and location permissions on every request and return no-store responses.
 * A public Pages route must not call this adapter for private records.
 */
export function createPrivateSource({endpoint,fetchImpl=fetch}={}){
  const base=new URL(endpoint);
  if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)
    throw new Error('Private API requires a clean HTTPS base URL');
  async function request(kind,key,signal){
    const allowed=kind==='module'?MODULES:PERIODS;
    if(!allowed.has(key))throw new Error('Unknown Studio OS request');
    const path=kind==='module'?`modules/${encodeURIComponent(key)}`:`reports/${encodeURIComponent(key)}`;
    try{
      const response=await fetchImpl(new URL(path,base.href.endsWith('/')?base.href:base.href+'/'),{
        method:'GET',credentials:'include',cache:'no-store',redirect:'error',signal,
        headers:{accept:'application/json'}
      });
      if(response.status===401||response.status===403)return unavailable(kind,key,'unauthorised');
      if(!response.ok)return unavailable(kind,key);
      return validate(await response.json(),kind,key);
    }catch(error){if(error?.name==='AbortError')throw error;return unavailable(kind,key)}
  }
  return Object.freeze({
    connection:Object.freeze({status:'not_connected',source:'approved_private_api',lastVerifiedAt:null}),
    readModule:(module,{signal}={})=>request('module',module,signal),
    readReport:(period,{signal}={})=>request('period',period,signal)
  });
}
