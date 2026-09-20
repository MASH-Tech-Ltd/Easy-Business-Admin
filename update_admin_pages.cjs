const fs = require('fs');
const path = require('path');

function updatePage(pagePath, eventName) {
  let content = fs.readFileSync(pagePath, 'utf-8');
  if (content.includes(`socket.on("${eventName}"`)) return;

  if (!content.includes('socket.io-client')) {
    content = content.replace('import { useState', 'import { io } from "socket.io-client";\nimport { useState');
  }

  // Find the end of imports
  // Just insert the useEffect logic inside the component. We can just add it before the return statement if it's tricky, but it's better to add it right after component declaration.
  // We can inject it using regex.
  const componentMatch = content.match(/const [A-Za-z0-9_]+ = \(\) => {/);
  if (componentMatch) {
    const hookStr = `\n  useEffect(() => {
    const adminUserStr = localStorage.getItem("user");
    let socket;
    if (adminUserStr) {
      try {
        socket = io("/");
        const user = JSON.parse(adminUserStr);
        socket.emit("join_user_room", user._id);
        
        socket.on("${eventName}", () => {
          // Trigger refetch depending on what RTK query or fetch is used
          // We can use a simple state toggle to trigger re-renders or assume refetch() exists
          if (typeof refetch === 'function') refetch();
          if (typeof fetchData === 'function') fetchData();
        });
      } catch (err) {}
    }
    return () => {
      if (socket) {
        socket.off("${eventName}");
        socket.close();
      }
    };
  }, []);\n`;
    content = content.replace(componentMatch[0], componentMatch[0] + hookStr);
    fs.writeFileSync(pagePath, content, 'utf-8');
  }
}

updatePage('src/pages/Users.jsx', 'refresh_tenants');
updatePage('src/pages/Clients.jsx', 'refresh_tenants');
updatePage('src/pages/Packages.jsx', 'refresh_packages');
console.log('Updated super-dashboard pages');
