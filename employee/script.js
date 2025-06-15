const base_url = "http://localhost/backends";
let selectedEmployeeId = 0;

function formatDateTime(datetimeStr) {
  if (!datetimeStr) return '';
  const fixedStr = datetimeStr.replace(' ', 'T') + 'Z'; // Parse as UTC
  const date = new Date(fixedStr);
  if (isNaN(date)) {
    console.warn(`Invalid date format: ${datetimeStr}`);
    return '';
  }
  console.log(`Parsing ${datetimeStr} as ${fixedStr}, result: ${date}`);
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila'
  });
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

// --- GET EMPLOYEES ---
async function getEmployees() {
  let request_url = `${base_url}/employee`;
  const loggedInEmployeeId = localStorage.getItem("employeeid");
  if (!loggedInEmployeeId) {
    console.error("No employeeid in localStorage. Redirecting to login.");
    alert("Please log in to view employees.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(request_url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized. Token may be invalid or expired.");
        alert("Session expired. Please log in again.");
        localStorage.clear();
        window.location.href = "login.html";
        return;
      }
      throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    console.log('Employees response:', json);
    if (json && Array.isArray(json.payload)) {
      renderEmployeesTable(json.payload);
    } else {
      console.error("Employees data is not an array:", json);
      renderEmployeesTable([]);
    }
  } catch (error) {
    console.error('Error fetching employees:', error.message);
    alert('Failed to fetch employees: ' + error.message);
  }
}

function renderEmployeesTable(data) {
  let table = document.getElementById("employeesTable");
  if (!table) {
    console.error("Employees table not found in DOM.");
    return;
  }

  let tbody = table.querySelector("tbody");
  if (!tbody) {
    tbody = document.createElement("tbody");
    table.appendChild(tbody);
  }
  tbody.innerHTML = "";

  const loggedInEmployeeId = localStorage.getItem("employeeid");
  console.log('Logged-in employeeid:', loggedInEmployeeId);
  console.log('Employee data:', data);

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No employees found.</td></tr>';
    return;
  }

  data.forEach((item, index) => {
    console.log(`Processing employee: ${item.employeeid}, matches logged-in: ${item.employeeid == loggedInEmployeeId}`);
    let row = document.createElement("tr");
    const timeinDisplay = item.timein && item.timein !== '-0001-11-30 00:00:00' ? formatDateTime(item.timein) : '';
    const timeoutDisplay = item.timeout && item.timeout !== '-0001-11-30 00:00:00' ? formatDateTime(item.timeout) : '';
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.employeeid || ""}</td>
      <td>${item.firstname || ""}</td>
      <td>${item.lastname || ""}</td>
      <td>${timeinDisplay}</td>
      <td>${timeoutDisplay}</td>
      <td class="actions"></td>
    `;

    const actionsCell = row.querySelector(".actions");
    if (item.employeeid == loggedInEmployeeId) {
      // Edit Button
      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.addEventListener('click', () => {
        selectedEmployeeId = item.employeeid;
        openEditModal(item);
      });
      actionsCell.appendChild(editBtn);

      // Delete Button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this employee?')) {
          deleteEmployee(item);
        }
      });
      actionsCell.appendChild(deleteBtn);
    }

    tbody.appendChild(row);
  });
}

// ----- Add Employee ---- //
async function addEmployee(e) {
  e.preventDefault();
  const firstname = document.getElementById("firstname").value;
  const lastname = document.getElementById("lastname").value;

  if (!firstname || !lastname) {
    document.getElementById("message").innerText = "Firstname and lastname are required.";
    return;
  }

  const data = { firstname, lastname };

  try {
    const response = await fetch(`${base_url}/addemployee`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (response.ok && result.status?.type === 'success') {
      alert("Employee added successfully!");
      getEmployees();
    } else {
      console.error("Error:", result.status?.message || "Failed to add employee");
      document.getElementById("message").innerText = result.status?.message || "Failed to add employee.";
    }
  } catch (error) {
    console.error("Network error:", error);
    document.getElementById("message").innerText = "Network error: Failed to add employee.";
  }
}

// --------- Edit Employee ---------
function openEditModal(item) {
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.background = "rgba(0,0,0,0.5)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "1000";

  const form = document.createElement("form");
  form.style.background = "white";
  form.style.padding = "20px";
  form.style.borderRadius = "5px";
  form.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
  form.innerHTML = `
    <h2>Edit Employee</h2>
    <label>First Name:</label>
    <input type="text" id="editFirstname" value="${item.firstname || ''}">
    <br><br>
    <label>Last Name:</label>
    <input type="text" id="editLastname" value="${item.lastname || ''}">
    <br><br>
    <button type="submit">Save</button>
    <button type="button" onclick="this.closest('.modal-content').remove()">Cancel</button>
  `;
  modal.className = "modal-content";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const firstname = document.getElementById("editFirstname").value.trim();
    const lastname = document.getElementById("editLastname").value.trim();

    if (!firstname || !lastname) {
      alert("Firstname and lastname are required.");
      return;
    }

    const data = { employeeid: item.employeeid, firstname, lastname };

    try {
      const response = await fetch(`${base_url}/editemployee`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok && result.status?.type === 'success') {
        alert("Employee updated successfully!");
        modal.remove();
        getEmployees();
      } else {
        console.error("Error:", result.status?.message || "Failed to update employee");
        alert(result.status?.message || "Failed to update employee.");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: Failed to update employee.");
    }
  });

  modal.appendChild(form);
  document.body.appendChild(modal);
}

async function editEmployee(e) {
  e.preventDefault();
  // This function is now handled by the modal submit event
}

// --------- Delete Employee ---------
async function deleteEmployee(item) {
  let request_url = `${base_url}/deleteemployee`;
  try {
    const response = await fetch(request_url, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ id: item.employeeid }),
    });

    const json = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized. Token may be invalid or expired.");
        alert("Session expired. Please log in again.");
        localStorage.clear();
        window.location.href = "login.html";
        return;
      }
      if (response.status === 403) {
        alert("You don't have permission to delete this employee.");
        return;
      }
      throw new Error(json.status?.message || `Response status: ${response.status}`);
    }

    if (json.status?.type === "success") {
      alert("Employee deleted successfully!");
      getEmployees(); // Refresh the employee table
    } else {
      throw new Error(json.status?.message || "Failed to delete employee");
    }
  } catch (error) {
    console.error('Error deleting employee:', error.message);
    alert('Failed to delete employee: ' + error.message);
  }
}

// --- GET DTR RECORDS ---
async function getDtrRecords() {
  if (!document.getElementById("dtrTable")) {
    console.log("Skipping getDtrRecords: dtrTable not found on page", window.location.href);
    return;
  }
  const employeeid = localStorage.getItem("employeeid");
  if (!employeeid) {
    console.error("Employee not logged in. No employeeid in localStorage.");
    alert("Please log in to view DTR records.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${base_url}/dtr`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized. Token may be invalid or expired.");
        alert("Session expired. Please log in again.");
        localStorage.clear();
        window.location.href = "login.html";
        return;
      }
      throw new Error(`Failed to fetch DTR: ${response.statusText}`);
    }
    const json = await response.json();
    console.log('DTR response:', json);
    const records = Array.isArray(json.payload) ? json.payload : [];
    console.log("Fetched DTR records:", records);
    renderDtrTable(records);
  } catch (error) {
    console.error("Error fetching DTR records for employeeid", employeeid, ":", error);
    alert("Failed to fetch DTR records: " + error.message);
  }
}

function renderDtrTable(data) {
  const table = document.getElementById("dtrTable");
  if (!table) {
    console.error("Table with ID 'dtrTable' not found in the DOM.");
    return;
  }

  let tbody = table.querySelector("tbody");
  if (!tbody) {
    tbody = document.createElement("tbody");
    table.appendChild(tbody);
  }
  tbody.innerHTML = "";

  const loggedInEmployeeId = localStorage.getItem("employeeid");
  console.log('Logged-in employeeid for DTR:', loggedInEmployeeId);
  console.log('DTR data:', data);

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No DTR records found.</td></tr>';
    return;
  }

  data.forEach((item, index) => {
    console.log(`Processing DTR: ${item.employeeid}, matches logged-in: ${item.employeeid == loggedInEmployeeId}`);
    const row = document.createElement("tr");
    const timeoutDisplay = item.timeout && item.timeout !== '-0001-11-30 00:00:00' ? formatDateTime(item.timeout) : "";

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.employeeid || ""}</td>
      <td>${formatDateTime(item.timein)}</td>
      <td>${timeoutDisplay}</td>
      <td class="actions"></td>
    `;

    const actionsCell = row.querySelector(".actions");

    if (item.employeeid == loggedInEmployeeId) {
      console.log(`Rendering actions for DTR ID ${item.id}: Time Out=${!item.timeout || item.timeout === '-0001-11-30 00:00:00'}, Delete=true`);
      if (!item.timeout || item.timeout === '-0001-11-30 00:00:00') {
        const timeoutBtn = document.createElement("button");
        timeoutBtn.textContent = "Time Out";
        timeoutBtn.addEventListener("click", async () => {
          try {
            const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
            const nowISO = new Date(now).toISOString();
            const response = await fetch(`${base_url}/updateDtr`, {
              method: "PATCH",
              headers: getAuthHeaders(),
              body: JSON.stringify({ id: item.id, timeout: nowISO }),
            });
            if (!response.ok) {
              const errorData = await response.json();
              if (response.status === 401) {
                console.error("Unauthorized. Token may be invalid or expired.");
                alert("Session expired. Please log in again.");
                localStorage.clear();
                window.location.href = "login.html";
                return;
              }
              throw new Error(errorData.status?.message || "Failed to update timeout");
            }
            await getDtrRecords();
            alert("Timeout recorded successfully!");
          } catch (error) {
            console.error("Error updating timeout:", error);
            alert("Failed to update timeout: " + error.message);
          }
        });
        actionsCell.appendChild(timeoutBtn);
      }

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.style.marginLeft = "5px";
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
          const response = await fetch(`${base_url}/deletedtr`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({ id: item.id }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401) {
              console.error("Unauthorized. Token may be invalid or expired.");
              alert("Session expired. Please log in again.");
              localStorage.clear();
              window.location.href = "login.html";
              return;
            } else if (response.status === 403) {
              alert("You don't have permission to delete this DTR record.");
              return;
            }
            throw new Error(errorData.status?.message || "Failed to delete record");
          }
          await getDtrRecords();
          alert("DTR record deleted successfully!");
        } catch (error) {
          console.error("Error deleting record:", error);
          alert("Failed to delete record: " + error.message);
        }
      });
      actionsCell.appendChild(deleteBtn);
    }

    tbody.appendChild(row);
  });
}

// --------- LOGIN / REGISTER / LOGOUT ---------
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("employeesTable")) {
    getEmployees();
  }
  if (document.getElementById("dtrTable")) {
    getDtrRecords();
  }

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

  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const pwdInput = document.getElementById("password");
      if (!pwdInput) return;
      const type = pwdInput.type === "password" ? "text" : "password";
      pwdInput.type = type;
      togglePassword.textContent = type === "password" ? "Show" : "Hide";
    });
  }

  if (toggleRegPassword) {
    toggleRegPassword.addEventListener("click", () => {
      const pwdInput = document.getElementById("regPassword");
      if (!pwdInput) return;
      const type = pwdInput.type === "password" ? "text" : "password";
      pwdInput.type = type;
      toggleRegPassword.textContent = type === "password" ? "Show" : "Hide";
    });
  }

  if (showRegister && loginForm && registerForm && message) {
    showRegister.addEventListener("click", (e) => {
      e.preventDefault();
      message.textContent = "";
      loginForm.style.display = "none";
      registerForm.style.display = "block";
    });
  }

  if (showLogin && loginForm && registerForm && message) {
    showLogin.addEventListener("click", (e) => {
      e.preventDefault();
      message.textContent = "";
      registerForm.style.display = "none";
      loginForm.style.display = "block";
    });
  }

  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  if (loginBtn && registerBtn && message && loginForm && registerForm) {
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
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        let data = await response.json();
        const statusType = (data.status?.type || "").trim().toLowerCase();

        if (!response.ok || statusType !== "success") {
          message.textContent = data.status?.message || "Login failed.";
          return;
        }
        const employee = data?.payload?.data?.employee;
        const token = data?.payload?.data?.token;
        if (!employee || !token) {
          message.textContent = "Invalid login response.";
          console.error("Missing employee or token:", data?.payload?.data);
          return;
        }

        localStorage.setItem("username", username);
        localStorage.setItem("employeeid", String(employee.employeeid));
        localStorage.setItem("firstname", employee.firstname);
        localStorage.setItem("lastname", employee.lastname);
        localStorage.setItem("token", token);

        // Record current timein in Asia/Manila
        const now = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });
        const timeinISO = new Date(now).toISOString().slice(0, 19).replace('T', ' ');
        console.log("Login timeinISO:", timeinISO);
        const timeinResponse = await fetch(`${base_url}/addDtr`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ employeeid: employee.employeeid, timein: timeinISO, timeout: null }),
        });
        const timeinData = await timeinResponse.json();
        if (!timeinResponse.ok) {
          console.warn("Failed to create timein record on login:", timeinData.status?.message, timeinResponse.status);
        } else {
          console.log("Timein record created:", timeinData);
        }

        message.textContent = "";
        window.location.href = "dashboard.html";
      } catch (error) {
        message.textContent = "Login failed: " + error.message;
        console.error("Login error:", error);
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
      if (!username || !firstname || !lastname || !employeeid) {
        message.textContent = "All fields are required.";
        return;
      }
      if (isNaN(employeeid) || employeeid <= 0) {
        message.textContent = "Employee ID must be a valid positive number.";
        return;
      }

      try {
        const response = await fetch(`${base_url}/register`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, firstname, lastname, employeeid }),
        });

        const data = await response.json();
        console.log("Registration response:", data);
        if (!response.ok || data.status?.type !== "success") {
          if (response.status === 409 && data.status?.message.includes("Employee ID already exists")) {
            message.textContent = "Employee ID already exists. Please use a different ID.";
            document.getElementById("regEmployeeid").style.border = "2px solid red";
          } else {
            message.textContent = data.status?.message || "Registration failed.";
          }
          return;
        }

        localStorage.setItem("username", username);
        localStorage.setItem("employeeid", String(employeeid));
        localStorage.setItem("firstname", firstname);
        localStorage.setItem("lastname", lastname);
        localStorage.setItem("token", data.payload.token);

        try {
          const timein = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
          const timeinISO = new Date(timein).toISOString();
          const timeinResponse = await fetch(`${base_url}/addDtr`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ employeeid, timein: timeinISO, timeout: null }),
          });
          if (!timeinResponse.ok) {
            console.warn("Failed to create timein record on register:", timeinResponse.status);
          }
        } catch (err) {
          console.warn("Error creating timein record on register:", err);
        }

        message.textContent = "Registration successful! Redirecting to dashboard...";
        registerForm.style.display = "none";
        loginForm.style.display = "block";  
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1000);
      } catch (error) {
        message.textContent = "Registration failed: " + error.message;
        console.error("Registration error:", error);
      }
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const employeeid = localStorage.getItem("employeeid");
      if (employeeid) {
        try {
          const response = await fetch(`${base_url}/dtr`, {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const json = await response.json();
            const records = Array.isArray(json.payload) ? json.payload : [];
            const latestDtr = records
              .filter(item => item.employeeid == employeeid && !item.timeout)
              .sort((a, b) => b.id - a.id)[0];

            if (latestDtr) {
              const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
              const nowISO = new Date(now).toISOString();
              await fetch(`${base_url}/updateDtr`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                body: JSON.stringify({ id: latestDtr.id, timeout: nowISO }),
              });
            }
          }
        } catch (error) {
          console.warn("Error setting timeout on logout:", error);
        }
      }
      localStorage.clear();
      window.location.href = "login.html";
    });
  }
});