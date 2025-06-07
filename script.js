const base_url = "http://localhost/backends";
let selectedEmployeeId = 0;

function formatDateTime(datetimeStr) {
  if (!datetimeStr) return '';
  const fixedStr = datetimeStr.replace(' ', 'T');
  const date = new Date(fixedStr);
  if (isNaN(date)) {
    console.warn(`Invalid date format: ${datetimeStr}`);
    return '';
  }

  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Get auth headers
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
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.employeeid || ""}</td>
      <td>${item.firstname || ""}</td>
      <td>${item.lastname || ""}</td>
      <td>${formatDateTime(item.timein)}</td>
      <td>${formatDateTime(item.timeout)}</td>
      <td class="actions"></td>
    `;

    const actionsCell = row.querySelector(".actions");
    if (item.employeeid == loggedInEmployeeId) {
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
async function editEmployee(e) {
  e.preventDefault();
  const firstname = document.getElementById("firstname").value;
  const lastname = document.getElementById("lastname").value;

  if (!firstname || !lastname) {
    document.getElementById("message").innerText = "Firstname and lastname are required.";
    return;
  }

  const data = { firstname, lastname };

  try {
    const response = await fetch(`${base_url}/editemployee`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (response.ok && result.status?.type === 'success') {
      alert("Employee updated successfully!");
      getEmployees();
    } else {
      console.error("Error:", result.status?.message || "Failed to update employee");
      document.getElementById("message").innerText = result.status?.message || "Failed to update employee.";
    }
  } catch (error) {
    console.error("Network error:", error);
    document.getElementById("message").innerText = "Network error: Failed to update employee.";
  }
}

// --------- Delete Employee ---------
async function deleteEmployee(item) {
  let body = { id: item.employeeid };
  let request_url = `${base_url}/deleteemployee`;
  try {
    const response = await fetch(request_url, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized. Token may be invalid or expired.");
        alert("Session expired. Please log in again.");
        localStorage.clear();
        window.location.href = "login.html";
        return;
      }
      const errorData = await response.json();
      throw new Error(errorData.status?.message || `Response status: ${response.status}`);
    }
    const json = await response.json();
    if (json.status?.type !== "success") {
      throw new Error(json.status?.message || "Failed to delete employee");
    }
    alert("Employee deleted successfully!");
    getEmployees();
  } catch (error) {
    console.error('Error deleting employee:', error.message);
    alert('Failed to delete employee: ' + error.message);
  }
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

        let data;
        try {
          data = await response.json();
        } catch (e) {
          message.textContent = "Unexpected server response.";
          console.error("Failed to parse JSON:", e);
          return;
        }
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

        try {
          const timeinResponse = await fetch(`${base_url}/addDtr`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ timein: new Date().toISOString(), timeout: '' }),
          });
          if (!timeinResponse.ok) {
            console.warn("Failed to create timein record on login:", timeinResponse.status);
          }
        } catch (err) {
          console.warn("Error creating timein record on login:", err);
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

      try {
        const response = await fetch(`${base_url}/register`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, firstname, lastname, employeeid }),
        });

        const data = await response.json();
        if (!response.ok || data.status?.type !== "success") {
          message.textContent = data.status?.message || "Registration failed.";
          return;
        }

        localStorage.setItem("username", username);
        localStorage.setItem("employeeid", String(employeeid));
        localStorage.setItem("firstname", firstname);
        localStorage.setItem("lastname", lastname);
        localStorage.setItem("token", data.payload.token);

        try {
          const timeinResponse = await fetch(`${base_url}/addDtr`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ timein: new Date().toISOString(), timeout: '' }),
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
        window.location.href = "dashboard.html";
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
              await fetch(`${base_url}/updateDtr`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                body: JSON.stringify({ id: latestDtr.id, timeout: new Date().toISOString() }),
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

// --- DASHBOARD PAGE --- //
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
    const timeoutDisplay = item.timeout ? formatDateTime(item.timeout) : "";

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.employeeid || ""}</td>
      <td>${formatDateTime(item.timein)}</td>
      <td>${timeoutDisplay}</td>
      <td class="actions"></td>
    `;

    const actionsCell = row.querySelector(".actions");

    if (item.employeeid == loggedInEmployeeId) {
      if (!item.timeout) {
        const timeoutBtn = document.createElement("button");
        timeoutBtn.textContent = "Time Out";
        timeoutBtn.addEventListener("click", async () => {
          try {
            const now = new Date().toISOString();
            const response = await fetch(`${base_url}/updateDtr`, {
              method: "PATCH",
              headers: getAuthHeaders(),
              body: JSON.stringify({ id: item.id, timeout: now }),
            });
            if (!response.ok) {
              if (response.status === 401) {
                console.error("Unauthorized. Token may be invalid or expired.");
                alert("Session expired. Please log in again.");
                localStorage.clear();
                window.location.href = "login.html";
                return;
              }
              throw new Error("Failed to update timeout");
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

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.style.marginLeft = "5px";
      editBtn.addEventListener("click", () => {
        openEditDtrModal(item);
      });
      actionsCell.appendChild(editBtn);

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
            if (response.status === 401) {
              console.error("Unauthorized. Token may be invalid or expired.");
              alert("Session expired. Please log in again.");
              localStorage.clear();
              window.location.href = "login.html";
              return;
            }
            throw new Error("Failed to delete record");
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

function openEditDtrModal(record) {
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
    <h2>Edit DTR Record</h2>
    <label>Time In:</label>
    <input type="datetime-local" id="editTimein" value="${record.timein ? record.timein.replace(' ', 'T').substr(0, 16) : ''}">
    <br><br>
    <label>Time Out:</label>
    <input type="datetime-local" id="editTimeout" value="${record.timeout ? record.timeout.replace(' ', 'T').substr(0, 16) : ''}">
    <br><br>
    <button type="submit">Save</button>
    <button type="button" onclick="this.closest('.modal-content').remove()">Cancel</button>
  `;
  modal.className = "modal-content";
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const timein = document.getElementById("editTimein").value;
    const timeout = document.getElementById("editTimeout").value || "";
    try {
      const response = await fetch(`${base_url}/updateDtr`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: record.id, timein, timeout }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized. Token may be invalid or expired.");
          alert("Session expired. Please log in again.");
          localStorage.clear();
          window.location.href = "login.html";
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.status?.message || "Failed to update DTR");
      }
      modal.remove();
      await getDtrRecords();
      alert("Success! DTR record updated successfully!");
    } catch (error) {
      console.error("Error updating DTR:", error);
      alert("Failed to update DTR: " + error.message);
    }
  });

  modal.appendChild(form);
  document.body.appendChild(modal);
}
