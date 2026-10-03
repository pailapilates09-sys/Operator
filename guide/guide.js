const button=document.getElementById('print-guide');
const status=document.getElementById('print-status');
if(button){
  button.hidden=false;
  button.addEventListener('click',async()=>{
    button.disabled=true;
    if(status)status.textContent='Preparing all infographic pages…';
    try{
      const images=Array.from(document.querySelectorAll('.guide-image'));
      await Promise.all(images.map(async img=>{
        img.loading='eager';
        await img.decode();
        if(!img.naturalWidth)throw new Error('Image unavailable');
      }));
      if(status)status.textContent='Ready to print. Choose A4 portrait and disable browser headers and footers.';
      window.print();
    }catch{
      if(status)status.textContent='An image could not load. Reload this page and try printing again.';
    }finally{button.disabled=false;}
  });
}
