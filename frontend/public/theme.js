try { document.documentElement.classList.toggle("dark", localStorage.getItem("theme") !== "light"); } catch { /* Dark is the default. */ }
