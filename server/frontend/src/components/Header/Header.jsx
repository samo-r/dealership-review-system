import React from "react";
import "../assets/style.css";
import "../assets/bootstrap.min.css";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const { user, role, logout } = useAuth();

  const handleLogout = (e) => {
    e.preventDefault();
    const username = user?.userName;
    logout();
    alert("Logging out " + username + "...");
    window.location.href = window.location.origin;
  };

  //The default home page items are the login details panel
  let home_page_items = <div></div>;

  //Gets the username in the current session
  const curr_user = user?.userName || null;

  //If the user is logged in, show the username, role badge, and logout option
  if (curr_user !== null && curr_user !== "") {
    home_page_items = (
      <div className="input_panel">
        <text className="username">{curr_user}</text>
        {role ? (
          <span
            style={{
              marginLeft: "8px",
              fontSize: "0.75em",
              background: "#00838f",
              color: "white",
              padding: "2px 7px",
              borderRadius: "4px",
              verticalAlign: "middle",
            }}
          >
            {role}
          </span>
        ) : null}
        <a className="nav_item" href="/" onClick={handleLogout}>
          Logout
        </a>
      </div>
    );
  }
  return (
    <div>
      <nav
        class="navbar navbar-expand-lg navbar-light"
        style={{ backgroundColor: "darkturquoise", height: "1in" }}
      >
        <div class="container-fluid">
          <h2 style={{ paddingRight: "5%" }}>Dealerships</h2>
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarText"
            aria-controls="navbarText"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarText">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <a
                  class="nav-link active"
                  style={{ fontSize: "larger" }}
                  aria-current="page"
                  href="/"
                >
                  Home
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  style={{ fontSize: "larger" }}
                  href="/about"
                >
                  About Us
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  style={{ fontSize: "larger" }}
                  href="/contact"
                >
                  Contact Us
                </a>
              </li>
            </ul>
            <span class="navbar-text">
              <div class="loginlink" id="loginlogout">
                {home_page_items}
              </div>
            </span>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Header;
