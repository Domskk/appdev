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
  console.log("Rendering employees table with data:", data);
  let table = document.getElementById("employeesTable");
  if (!table) return;

  let tbody = table.querySelector("tbody");
  if (!tbody) {
    tbody = document.createElement("tbody");
    table.appendChild(tbody);
  }
  tbody.innerHTML = ""; // Clear existing rows

  data.forEach((item, index) => {
    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.employeeid || ""}</td>
      <td>${item.firstname || ""}</td>
      <td>${item.lastname || ""}</td>
      <td>${item.timein || ""}</td>
      <td>${item.timeout || ""}</td>
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

  // ----- Add data.employee ---- //
  async function addEmployee() {
    const employeeid = document.getElementById("employeeid").value;
    const firstname = document.getElementById("firstname").value;
    const lastname = document.getElementById("lastname").value;

    const data = { employeeid, firstname, lastname };

    try {
      const response = await fetch(`${base_url}/addemployee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Employee added successfully!");
        getEmployees(); // refresh table
      } else {
        console.error("Error:", result.message);
        document.getElementById("message").innerText = "Failed to add data.employee.";
      }
    } catch (error) {
      console.error("Network error:", error);
      document.getElementById("message").innerText = "Failed to add data.employee.";
    }
  }

  // --------- EDIT EMPLOYEE ---------
  async function editEmployee(e) {
    const employeeid = document.getElementById("employeeid").value;
    const firstname = document.getElementById("firstname").value;
    const lastname = document.getElementById("lastname").value;

    const data = { employeeid, firstname, lastname };

    try {
      const response = await fetch(`${base_url}/editemployee/${selectedEmployeeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Employee updated successfully!");
        getEmployees(); // refresh table
      } else {
        console.error("Error:", result.message);
        document.getElementById("message").innerText = "Failed to update data.employee.";
      }
    } catch (error) {
      console.error("Network error:", error);
      document.getElementById("message").innerText = "Failed to update data.employee.";
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
        throw new Error(json.message || "Failed to delete data.employee");
      }
      getEmployees();
    } catch (error) {
      console.error(error.message);
    }
  }

  // --------- LOGIN / REGISTER ---------
  document.addEventListener("DOMContentLoaded", () => {
    getEmployees();

    const addForm = document.getElementById("addEmployeeForm");
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
    
    if (!loginBtn || !registerBtn || !message || !loginForm || !registerForm) return; 
  loginBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    message.textContent = "Please enter username and password.";
    return;
  }

  try {
    const response = await fetch(`${base_url}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      message.textContent = "Unexpected server response.";
      console.error("Failed to parse JSON:", e);
      return;
    }
    console.log("FULL response data:", data);
    const statusType = (data.status?.type || "").trim().toLowerCase();

    if (!response.ok || statusType !== "success") {
      message.textContent = data.status?.message || "Login failed.";
      return;
    }
    const employee = data?.payload?.data?.employee;
    if (!employee) {
      message.textContent = "No employee info in login response.";
      console.error("data.employee is missing:", data?.payload?.data);
    }
    // Save records
    localStorage.setItem("username", username);
    localStorage.setItem("employeeid", employee.employeeid);
    localStorage.setItem("firstname", employee.firstname);
    localStorage.setItem("lastname", employee.lastname);
    message.textContent = "";
    window.location.href = "dashboard.html";
  } catch (error) {
    message.textContent = "Login failed.";
  }
});

  registerBtn.addEventListener("click", async () => {
    const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value;
  const firstname = document.getElementById("regFirstname").value.trim();
  const lastname = document.getElementById("regLastname").value.trim();
  const employeeid = document.getElementById("regEmployeeid").value.trim();


    if (password.length < 6) {
      message.textContent = "Password must be at least 6 characters.";
      return;
    }

    try {
      const response = await fetch(`${base_url}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, firstname, lastname, employeeid }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error("Invalid JSON response from server");
      }

      if (!response.ok || data.status?.type !== "success") {
        message.textContent = data.status?.message || "Registration failed.";
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
  document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        window.location.href = "login.html"; // Redirect to login page
      });
    }
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

    function normalizeDtrRecord(record) {
    return {
      id: record.id,
      employeeid: record.employeeid || record.employeeId || '',
      timein: record.timein || record.timeIn || '',
      timeout: record.timeout || record.timeOut || '',
    };
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
        let savedRecord;

        if (editIndex !== null && editId) {
    // Update DTR on backend
    const response = await fetch(`${base_url}/updateDtr`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId, timein: timeIn, timeout: timeOut }),
    });
    if (!response.ok) throw new Error('Failed to update DTR');
    savedRecord = await response.json();
  } else {
    // Add new DTR on backend
    const response = await fetch(`${base_url}/addDtr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dtrPayload),
    });
    if (!response.ok) throw new Error('Failed to add DTR');
    savedRecord = await response.json();
  }

        // fetch fresh data from backend and render:
        await fetchAndSyncDtrFromBackend();
        await getEmployees();

        addDtrForm.reset();
        addDtrForm.removeAttribute('data-edit-index');
        addDtrForm.removeAttribute('data-edit-id');
        renderDtrTable();
        await getEmployees();
        localStorage.setItem('dtr-updated', Date.now());
      } catch (err) {
        alert(err.message);
      }
    });
  }// Initial load: sync from backend then render
    fetchAndSyncDtrFromBackend();

    // Listen for localStorage changes from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'dtr-updated') {
        fetchAndSyncDtrFromBackend();
        getEmployees();
      }
    });
  });

