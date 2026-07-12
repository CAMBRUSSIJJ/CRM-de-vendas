(function(W,D){
  'use strict';
  if(W.CRMEvents) return;
  W.CRMEvents=Object.freeze({
    on(name,handler,options){D.addEventListener(name,handler,options);return()=>D.removeEventListener(name,handler,options)},
    emit(name,detail){return D.dispatchEvent(new CustomEvent(name,{detail}))}
  });
})(window,document);
