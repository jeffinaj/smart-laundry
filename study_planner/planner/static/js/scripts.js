document.addEventListener('DOMContentLoaded', () => {
  const toast = document.getElementById('toast')
  function showToast(msg){
    toast.textContent = msg; toast.classList.remove('hidden');
    setTimeout(()=>toast.classList.add('hidden'),2500)
  }

  // Theme toggle
  const tbtn = document.getElementById('toggleTheme')
  if(tbtn){
    const current = localStorage.getItem('theme')
    if(current === 'dark') document.body.classList.add('dark')
    tbtn.addEventListener('click', ()=>{
      document.body.classList.toggle('dark')
      const isDark = document.body.classList.contains('dark')
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
      showToast(isDark ? 'Dark mode on' : 'Light mode on')
    })
  }

  // Polling for real-time updates (every 8s)
  async function poll(){
    try{
      const res = await fetch('/api/tasks/')
      if(res.ok){
        const data = await res.json()
        // Example: update upcoming count in header if present
        // (UI updates can be extended by the developer)
        // console.log(data.tasks)
      }
    }catch(e){/* ignore network errors */}
  }
  setInterval(poll,8000)

  // Search input (if present)
  const search = document.getElementById('search')
  const subjectFilter = document.getElementById('subjectFilter')
  if(search){
    let timeout
    search.addEventListener('input', ()=>{
      clearTimeout(timeout)
      timeout = setTimeout(()=>{
        const q = search.value
        const subject = subjectFilter ? subjectFilter.value : ''
        fetch(`/api/search/?q=${encodeURIComponent(q)}&subject=${encodeURIComponent(subject)}`)
          .then(r=>r.json()).then(json=>{
            showToast(`${json.results.length} results`)
          })
      },300)
    })
  }
})
