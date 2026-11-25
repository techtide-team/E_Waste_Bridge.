
import { supabase } from "./supabase.js";

const loginForm = document.getElementById("recyclerLoginForm");

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const loginMessage = document.getElementById("loginMessage");
    const loginButton = loginForm.querySelector("button");

    loginButton.disabled = true;
    loginMessage.textContent = "Logging in...";

    // Sign in using Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        loginMessage.textContent = "Invalid email or password.";
        loginButton.disabled = false;
        return;
    }

    // Check recycler profile
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, recycler_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

    if (profileError || !profile ||
        profile.role !== "recycler" || !profile.recycler_id) {

        loginMessage.textContent = "Recycler account not found.";

        await supabase.auth.signOut();

        loginButton.disabled = false;
        return;
    }

    // Login successful
    window.location.href = "recycler-dashboard.html";

});
