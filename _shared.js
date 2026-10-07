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

// Get the current user's Airtable record (cached in sessionStorage)
async function getAirtableUser() {
  var cached = sessionStorage.getItem("at_user");
  if (cached) return JSON.parse(cached);

  await window.__clerkLoaded;
  var email = window.Clerk.user?.primaryEmailAddress?.emailAddress;
  if (!email) return null;

  // We store the AT token in a hidden meta tag per page (added by each page that needs it)
  var keyEl = document.querySelector('meta[name="at-key"]');
  if (!keyEl) return null;
  var key = keyEl.content;

  var res = await fetch(
    "https://api.airtable.com/v0/" + AT_BASE + "/" + AT_USERS_TBL +
    "?filterByFormula=" + encodeURIComponent('{Email}="' + email + '"'),
    { headers: { Authorization: "Bearer " + key } }
  );
  var data = await res.json();
  if (data.records && data.records.length) {
    var rec = { id: data.records[0].id, fields: data.records[0].fields };
    sessionStorage.setItem("at_user", JSON.stringify(rec));
    return rec;
  }
  return null;
}

// Render the nav into #nav-mount
function renderNav(activePage) {
  var navItems = [
    { label: "Dashboard", href: "/dashboard.html" },
    { label: "My Plans", href: "/my-plans.html" },
    { label: "New Plan", href: "/new-plan.html" },
  ];

  var links = navItems.map(function(item) {
    var active = activePage === item.label;
    return '<a href="' + item.href + '" style="' +
      'font-size:13px;font-weight:600;color:' + (active ? '#FAF6ED' : 'rgba(250,246,237,0.7)') + ';' +
      'text-decoration:none;padding:6px 12px;border-radius:6px;' +
      (active ? 'background:rgba(255,255,255,0.15);' : '') +
      '">' + item.label + '</a>';
  }).join('');

  var html = '<nav style="background:#4A1040;padding:0 32px;display:flex;align-items:center;gap:8px;height:52px;position:sticky;top:0;z-index:100;">' +
    '<a href="/dashboard.html" style="font-family:\'Playfair Display\',Georgia,serif;font-size:18px;font-weight:700;color:#FAF6ED;text-decoration:none;margin-right:24px;letter-spacing:-0.02em;">AdCraft</a>' +
    links +
    '<div style="flex:1;"></div>' +
    '<div id="clerk-user-btn"></div>' +
    '</nav>';

  var mount = document.getElementById("nav-mount");
  if (mount) {
    mount.innerHTML = html;
    // Mount Clerk UserButton into nav
    window.__clerkLoaded.then(function() {
      if (window.Clerk && window.Clerk.mountUserButton) {
        window.Clerk.mountUserButton(document.getElementById("clerk-user-btn"), {
          afterSignOutUrl: "/login.html"
        });
      }
    });
  }
}

// Load Clerk and expose a promise that resolves when ready
window.__clerkLoaded = new Promise(function(resolve) {
  var script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5.56.0/dist/clerk.browser.js";
  script.onload = async function() {
    var clerk = new window.Clerk(CLERK_KEY);
    await clerk.load();
    window.Clerk = clerk;
    resolve(clerk);
  };
  document.head.appendChild(script);
});
