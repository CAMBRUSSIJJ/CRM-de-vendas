export class LifecycleRegistry {
  constructor(){this.modules=new Map();this.current=''}
  register(name,hooks={}){this.modules.set(name,{mount:hooks.mount||(()=>{}),render:hooks.render||(()=>{}),unmount:hooks.unmount||(()=>{}),destroy:hooks.destroy||(()=>{}),mounted:false});return()=>this.destroy(name)}
  async activate(name,context={}){
    if(this.current&&this.current!==name)await this.deactivate(this.current,context);
    const mod=this.modules.get(name);if(!mod)return false;
    if(!mod.mounted){await mod.mount(context);mod.mounted=true}
    await mod.render(context);this.current=name;return true
  }
  async deactivate(name=this.current,context={}){const mod=this.modules.get(name);if(!mod||!mod.mounted)return false;await mod.unmount(context);if(this.current===name)this.current='';return true}
  async destroy(name){const mod=this.modules.get(name);if(!mod)return false;if(mod.mounted)await mod.unmount({reason:'destroy'});await mod.destroy();this.modules.delete(name);if(this.current===name)this.current='';return true}
  status(){return {current:this.current,registered:[...this.modules.keys()]}}
}
