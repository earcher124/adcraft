// AdCraft shared utilities — included on every page
// Clerk publishable key
var CLERK_KEY = "pk_test_cmlnaHQtc3F1aXJyZWwtNjQwOC5jbGVyay5hY2NvdW50cy5kZXYk";

// Airtable config
var AT_BASE = "appCtUgAKIoaa6ECh";
var AT_USERS_TBL = "tbl7fisATFgQXPOhP"; // Users table ID

// Redirect to login if not signed in
async function requireAuth() {
  await window.__clerkLoaded;
  const user = window.Clerk.user;
  if (!user) {
    window.location.href = "/login.html";
    return null;
  }
  return user;
}

// Render the nav into #nav-mount
function renderNav(activePage) {
  var navItems = [
    { label: "Dashboard", href: "/dashboard.html" },
    { label: "My Plans", href: "/my-plans.html" },
    { label: "New Plan", href: "/new-plan.html" },
    { label: "Account", href: "/account.html" },
  ];

  var links = navItems.map(function(item) {
    var active = activePage === item.label;
    return '<a href="' + item.href + '" class="nav-link" style="' +
      'font-size:13px;font-weight:600;color:' + (active ? '#FAF6ED' : 'rgba(250,246,237,0.7)') + ';' +
      'text-decoration:none;padding:6px 10px;border-radius:6px;white-space:nowrap;' +
      (active ? 'background:rgba(255,255,255,0.15);' : '') +
      '">' + item.label + '</a>';
  }).join('');

  var html = '<style>' +
    '@media(max-width:500px){.nav-link{font-size:12px;padding:5px 7px!important;}}' +
    '@media(max-width:400px){.nav-link-account{display:none!important;}}' +
    '</style>' +
    '<nav style="background:#4A1040;padding:0 16px;display:flex;align-items:center;gap:4px;height:52px;position:sticky;top:0;z-index:100;min-width:0;">' +
    '<a href="/dashboard.html" style="font-family:\'Playfair Display\',Georgia,serif;font-size:18px;font-weight:700;color:#FAF6ED;text-decoration:none;margin-right:12px;letter-spacing:-0.02em;flex-shrink:0;">AdCraft</a>' +
    links.replace('">Account<', '" class="nav-link-account">Account<') +
    '<div style="flex:1;min-width:4px;"></div>' +
    '<div id="clerk-user-btn" style="flex-shrink:0;"></div>' +
    '</nav>';

  var mount = document.getElementById("nav-mount");
  if (mount) {
    mount.innerHTML = html;
    // Mount Clerk UserButton into nav, fall back to a plain sign-out link
    window.__clerkLoaded.then(function(clerk) {
      var btn = document.getElementById("clerk-user-btn");
      if (!btn) return;
      if (clerk && clerk.mountUserButton) {
        try {
          clerk.mountUserButton(btn, { afterSignOutUrl: "/login.html" });
        } catch(e) {}
      }
      // Always show a plain sign-out link so there's always a way to log out
      var link = document.createElement("a");
      link.href = "#";
      link.textContent = "Sign out";
      link.style.cssText = "color:#FAF6ED;opacity:0.7;font-size:13px;text-decoration:none;margin-left:12px;";
      link.addEventListener("click", function(e) {
        e.preventDefault();
        if (clerk && clerk.signOut) clerk.signOut().then(function() { window.location.href = "/login.html"; });
        else window.location.href = "/login.html";
      });
      btn.appendChild(link);
    });
  }
}

// Load Clerk and expose a promise that resolves when ready
window.__clerkLoaded = new Promise(function(resolve) {
  var script = document.createElement("script");
  script.async = true;
  script.src = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js";
  script.setAttribute("data-clerk-publishable-key", CLERK_KEY);
  script.onload = async function() {
    // When loaded with data-clerk-publishable-key, clerk-js auto-initializes
    // and exposes the instance at window.Clerk
    await window.Clerk.load();
    resolve(window.Clerk);
  };
  document.head.appendChild(script);
});
