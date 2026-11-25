
import { supabase } from "./supabase.js";

async function testConnection() {

    console.log("Connecting to Supabase...");

    const { data, error } = await supabase
        .from("colleges")
        .select("id")
        .limit(1);

    if (error) {
        console.error("Connection failed:", error.message);
    } else {
        console.log("Supabase connection successful!");
        console.log("Returned data:", data);
    }
}

testConnection();
