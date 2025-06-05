const base_url = "http://localhost/backends";
let selectedEmployeeId = 0;

//--- GET EMPLOYEES --------- //
async function getEmployees() {
  let request_url = `${base_url}/employee`;
  console.log('Fetching employees from', request_url);
  try {
    const response = await fetch(request_url);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    const json = await response.json();
    console.log('Fetched employees:', json); // <--- Check this output!
    renderEmployeesTable(json);
  } catch (error) {
    console.error(error.message);
  }
}

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  return new Date(dateTimeStr.replace(' ', 'T')).toLocaleString();
}

function renderEmployeesTable(data) {
  let table = document.getElementById("employeesTable");
  if (!table) return;
  let tbody = table.querySelector("tbody");
  if (!tbody) {
    tbody = document.createElement("tbody");
    table.appendChild(tbody);
  }
  tbody.innerHTML = "";
  data.forEach((item, index) => {
    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.employeeid || ""}</td>
      <td>${item.firstname || ""}</td>
      <td>${item.lastname || ""}</td>
      <td>${formatDateTime(item.timein)}</td>
      <td>${formatDateTime(item.timeout)}</td>
      <td>
        <button class="delete-btn">Delete</button>
      </td>
    `;
    row.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this employee?')) {
        deleteEmployee(item);
      }
    });
    tbody.appendChild(row);
  });
}

// ----- Add employee ---- //
async function addEmployee(event) {
  event.preventDefault();
  let body = {
    employeeid: event.target.employeeid.value,
    firstname: event.target.firstname.value,
    lastname: event.target.lastname.value,
    timein: event.target.timein.value,
    timeout: event.target.timeout.value
  };

  let request_url = `${base_url}/employee`;
  try {
    const response = await fetch(request_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    await response.json();
    getEmployees();
  } catch (error) {
    console.error(error.message);
  }
}

// --------- EDIT EMPLOYEE ---------
async function editEmployee(event) {
  event.preventDefault();
  let body = {
    employeeid: event.target.employeeid.value,
    fullname: event.target.fullname.value,
    id: selectedEmployeeId,
  };

  let request_url = `${base_url}/updateemployee`;
  try {
    const response = await fetch(request_url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    await response.json();
    getEmployees();
  } catch (error) {
    console.error(error.message);
  }
}

// --------- DELETE EMPLOYEE ---------
async function deleteEmployee(item) {
  let body = { id: item.employeeid };
  let request_url = `${base_url}/deleteemployee`;
  try {
    const response = await fetch(request_url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Response status: ${response.status}`);
    }
    const json = await response.json();
    if (json.status !== "success") {
      throw new Error(json.message || "Failed to delete employee");
    }
    getEmployees();
  } catch (error) {
    console.error(error.message);
  }
}

// --------- LOGIN / REGISTER ---------
document.addEventListener("DOMContentLoaded", () => {
  getEmployees();

  const addForm = document.getElementById("addemployee");
  if (addForm) addForm.addEventListener("submit", addEmployee);

  const editForm = document.getElementById("editemployee");
  if (editForm) editForm.addEventListener("submit", editEmployee);

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const message = document.getElementById("message");

  const togglePassword = document.getElementById("togglePassword");
  const toggleRegPassword = document.getElementById("toggleRegPassword");

  const showRegister = document.getElementById("showRegister");
  const showLogin = document.getElementById("showLogin");


  // Toggle password visibility for login
  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const pwdInput = document.getElementById("password");
      if (!pwdInput) return;
      const type = pwdInput.type === "password" ? "text" : "password";
      pwdInput.type = type;
      togglePassword.textContent = type === "password" ? "Show" : "Hide";
    });
  }

  // Toggle password visibility for register
  if (toggleRegPassword) {
    toggleRegPassword.addEventListener("click", () => {
      const pwdInput = document.getElementById("regPassword");
      if (!pwdInput) return;
      const type = pwdInput.type === "password" ? "text" : "password";
      pwdInput.type = type;
      toggleRegPassword.textContent = type === "password" ? "Show" : "Hide";
    });
  }

  // Show register form
  if (showRegister && loginForm && registerForm && message) {
    showRegister.addEventListener("click", (e) => {
      e.preventDefault();
      message.textContent = "";
      loginForm.style.display = "none";
      registerForm.style.display = "block";
    });
  }

  // Show login form
  if (showLogin && loginForm && registerForm && message) {
    showLogin.addEventListener("click", (e) => {
      e.preventDefault();
      message.textContent = "";
      registerForm.style.display = "none";
      loginForm.style.display = "block";
    });
  }
});

  // Login handler
 document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const message = document.getElementById("message");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  loginBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
      message.textContent = "Please enter username and password.";
      return;
    }

    try {
      const response = await fetch(`${base_url}?request=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        message.textContent = data.message || "Login failed.";
      } else {
        message.textContent = "";
        // Redirect or show logged-in UI
        window.location.href = "/dashboard.html";
      }
    } catch (error) {
      message.textContent = "Login failed.";
      console.error(error);
    }
  });

  registerBtn.addEventListener("click", async () => {
    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value;

    if (!username || !password) {
      message.textContent = "Please enter username and password.";
      return;
    }

    if (password.length < 6) {
      message.textContent = "Password must be at least 6 characters.";
      return;
    }

    try {
      const response = await fetch(`${base_url}?request=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        message.textContent = data.message || "Registration failed.";
      } else {
        message.textContent = "Registration successful! You can now login.";
        registerForm.style.display = "none";
        loginForm.style.display = "block";
      }
    } catch (error) {
      message.textContent = "Registration failed.";
      console.error(error);
    }
  });
});
document.addEventListener('DOMContentLoaded', () => {
  const dtrTableBody = document.querySelector('#dtrTable tbody');
  const addDtrForm = document.getElementById('addDtrForm');

  function getDtrRecords() {
    const records = localStorage.getItem('dtrRecords');
    return records ? JSON.parse(records) : [];
  }

  function saveDtrRecords(records) {
    localStorage.setItem('dtrRecords', JSON.stringify(records));
  }

  async function fetchAndSyncDtrFromBackend() {
    try {
      const response = await fetch(`${base_url}/dtr`);
      if (!response.ok) throw new Error('Failed to fetch DTR from backend');
      const backendRecords = await response.json();
      saveDtrRecords(backendRecords);
      renderDtrTable();
    } catch (err) {
      console.error(err);
      // fallback: render from localStorage
      renderDtrTable();
    }
  }

  async function renderDtrTable() {
    const records = getDtrRecords();
    if (!dtrTableBody) return;
    dtrTableBody.innerHTML = '';

    records.forEach((rec, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${rec.employeeid || rec.employeeId || ''}</td>
        <td>${formatDateTime(rec.timein || rec.timeIn)}</td>
        <td>${formatDateTime(rec.timeout || rec.timeOut)}</td>
        <td>
          <button class="edit-dtr-btn">Edit</button>
          <button class="delete-dtr-btn">Delete</button>
        </td>
      `;

      tr.querySelector('.edit-dtr-btn').addEventListener('click', () => {
        document.getElementById('employeeid').value = rec.employeeid || rec.employeeId || '';
        document.getElementById('timein').value = rec.timein || rec.timeIn || '';
        document.getElementById('timeout').value = rec.timeout || rec.timeOut || '';
        addDtrForm.setAttribute('data-edit-index', i);
        addDtrForm.setAttribute('data-edit-id', rec.id); // assuming backend provides id
      });

      tr.querySelector('.delete-dtr-btn').addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
          const idToDelete = rec.id;
          if (!idToDelete) throw new Error('No ID found for this record');
          const response = await fetch(`${base_url}/deletedtr`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: idToDelete }),
          });
          if (!response.ok) throw new Error('Failed to delete DTR from backend');
          // Remove from localStorage
          const updatedRecords = getDtrRecords().filter(r => r.id !== idToDelete);
          saveDtrRecords(updatedRecords);
          renderDtrTable();
          await getEmployees();
          localStorage.setItem('dtr-updated', Date.now());
        } catch (err) {
          alert(err.message);
        }
      });

      dtrTableBody.appendChild(tr);
    });
  }

  if (addDtrForm) {
   addDtrForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const employeeId = document.getElementById('employeeid').value.trim();
  const timeIn = document.getElementById('timein').value;
  const timeOut = document.getElementById('timeout').value;

  const editIndex = addDtrForm.getAttribute('data-edit-index');
  const editId = addDtrForm.getAttribute('data-edit-id');

  const dtrPayload = { employeeid: employeeId, timein: timeIn, timeout: timeOut };

  try {
    if (editIndex !== null && editId) {
      // Update DTR on backend
      const response = await fetch(`${base_url}/updateDtr`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, timein: timeIn, timeout: timeOut })
      });
      if (!response.ok) throw new Error('Failed to update DTR');
    } else {
      // Add new DTR on backend
      const response = await fetch(`${base_url}/addDtr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dtrPayload)
      });
      if (!response.ok) throw new Error('Failed to add DTR');
  
          // Add to localStorage with backend id
          records.push(savedRecord);
          saveDtrRecords(records);
        }

        addDtrForm.reset();
        addDtrForm.removeAttribute('data-edit-index');
        addDtrForm.removeAttribute('data-edit-id');

        renderDtrTable();
        await getEmployees();
        localStorage.setItem('dtr-updated', Date.now());
        location.reload();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Initial load: sync from backend then render
  fetchAndSyncDtrFromBackend();

  // Listen for localStorage changes from other tabs
  window.addEventListener('storage', (event) => {
    if (event.key === 'dtr-updated') {
      fetchAndSyncDtrFromBackend();
      getEmployees();
    }
  });
});