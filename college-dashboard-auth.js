
import { supabase } from "./supabase.js";

async function loadCollegeDashboard() {

    // ==========================================
    // 1. CHECK COLLEGE LOGIN
    // ==========================================

    const { data, error: authError } =
        await supabase.auth.getUser();

    const user = data?.user;

    if (authError || !user) {
        window.location.href = "college-login.html";
        return;
    }

    // ==========================================
    // 2. GET COLLEGE PROFILE
    // ==========================================

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, college_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (
        profileError ||
        !profile ||
        profile.role !== "college" ||
        !profile.college_id
    ) {
        console.error("College profile error:", profileError);

        alert("College account not found. Please log in again.");

        await supabase.auth.signOut();

        window.location.href = "college-login.html";
        return;
    }

    // ==========================================
    // 3. LOAD COLLEGE DETAILS
    // ==========================================

    const { data: college, error: collegeError } = await supabase
        .from("colleges")
        .select("college_name")
        .eq("id", profile.college_id)
        .maybeSingle();

    if (collegeError || !college) {
        console.error("College details error:", collegeError);
        alert("Unable to load college details.");
        return;
    }

    document.getElementById("collegeName").textContent =
        college.college_name;


    // ==========================================
    // 4. LOAD COLLEGE REQUESTS
    // ==========================================

    async function loadCollegeRequests() {

        const tableBody =
            document.getElementById("requestsTableBody");

        const { data: requests, error } = await supabase
    .from("ewaste_requests")
    .select(`
        request_id,
        category,
        quantity,
        quantity_unit,
        status,
        collections (
            collected_quantity
        )
    `)
    .eq("college_id", profile.college_id)
    .order("created_at", { ascending: false });

        if (error) {
            console.error(
                "Request loading error:",
                JSON.stringify(error, null, 2)
            );

            tableBody.textContent =
                "Unable to load requests.";

            return;
        }

        tableBody.replaceChildren();

        if (!requests || requests.length === 0) {

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 6;
            cell.textContent = "No requests submitted yet.";

            row.appendChild(cell);
            tableBody.appendChild(row);

            return;
        }

        requests.forEach(function (request) {

            const row = document.createElement("tr");

            const collectedQuantity =
    (request.collections || []).reduce(function (total, collection) {
        return total + Number(collection.collected_quantity || 0);
    }, 0);

const pendingQuantity = Math.max(
    Number(request.quantity) - collectedQuantity,
    0
);

const values = [
    request.request_id,
    request.category,
    request.quantity + " " + request.quantity_unit,
    collectedQuantity + " " + request.quantity_unit,
    pendingQuantity + " " + request.quantity_unit,
    request.status
];

            values.forEach(function (value) {

                const cell = document.createElement("td");

                cell.textContent = value;

                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    }


    // ==========================================
    // 5. LOAD RECYCLER QUOTATIONS
    // ==========================================

    async function loadCollegeQuotations() {

        const offersContainer =
            document.getElementById("offersContainer");

        const { data: quotations, error } = await supabase
            .from("quotations")
            .select(`
                id,
                request_id,
                recycler_id,
                offered_amount,
                collection_charges,
                estimated_days,
                terms,
                status,
                ewaste_requests ( request_id )
            `)
            .order("created_at", { ascending: false });

        if (error) {

            console.error(
                "Quotation loading error:",
                JSON.stringify(error, null, 2)
            );

            offersContainer.textContent =
                "Unable to load recycler quotations.";

            return;
        }

        offersContainer.replaceChildren();

        if (!quotations || quotations.length === 0) {

            offersContainer.textContent =
                "No quotations received yet.";

            return;
        }

        quotations.forEach(function (quotation) {

            const card = document.createElement("div");

            card.className = "offer-card";

            // Recycler name / ID
            const heading = document.createElement("h3");

            heading.textContent =
                "Recycler #" + quotation.recycler_id;

            // Request ID
            const requestText = document.createElement("p");

            requestText.textContent =
                "Request ID: " +
                (
                    quotation.ewaste_requests?.request_id ||
                    quotation.request_id
                );

            // Offered amount
            const amount = document.createElement("h2");

            amount.textContent =
                "₹" +
                Number(quotation.offered_amount)
                    .toLocaleString("en-IN");

            // Collection charges
            const charges = document.createElement("p");

            charges.textContent =
                "Collection Charges: ₹" +
                Number(quotation.collection_charges)
                    .toLocaleString("en-IN");

            // Estimated days
            const days = document.createElement("p");

            days.textContent =
                "Estimated Collection: " +
                quotation.estimated_days + " days";

            // Terms
            const terms = document.createElement("p");

            terms.textContent =
                "Terms: " +
                (quotation.terms || "Not provided");

            // Quotation status
            const status = document.createElement("span");

            status.className =
                quotation.status === "accepted"
                    ? "status completed"
                    : quotation.status === "pending"
                        ? "status pending"
                        : "status review";

            status.textContent = quotation.status;

            card.append(
                heading,
                requestText,
                amount,
                charges,
                days,
                terms,
                status
            );

            // ==================================
            // ACCEPT QUOTATION BUTTON
            // ==================================

            if (quotation.status === "pending") {

                const acceptButton =
                    document.createElement("button");

                acceptButton.type = "button";

                acceptButton.textContent =
                    "Accept Quotation";

                acceptButton.addEventListener(
                    "click",
                    async function () {

                        const confirmSelection = confirm(
                            "Are you sure you want to accept this quotation?"
                        );

                        if (!confirmSelection) {
                            return;
                        }

                        acceptButton.disabled = true;

                        acceptButton.textContent =
                            "Processing...";

                        const { error: selectionError } =
                            await supabase.rpc(
                                "select_quotation",
                                {
                                    p_quotation_id: quotation.id
                                }
                            );

                        if (selectionError) {

                            console.error(
                                "Quotation selection error:",
                                JSON.stringify(
                                    selectionError,
                                    null,
                                    2
                                )
                            );

                            alert(
                                "Unable to accept quotation. Please try again."
                            );

                            acceptButton.disabled = false;

                            acceptButton.textContent =
                                "Accept Quotation";

                            return;
                        }

                        alert(
                            "Quotation accepted successfully!"
                        );

                        await loadCollegeRequests();

                        await loadCollegeQuotations();

                        await loadCollegePassports();
                    }
                );

                card.appendChild(acceptButton);
            }

            offersContainer.appendChild(card);
        });
    }


    // ==========================================
    // 6. LOAD E-WASTE PASSPORT
    // ==========================================

    async function loadCollegePassports() {

        const passportContainer =
            document.getElementById("passportContainer");

        const { data: passports, error } = await supabase
            .from("ewaste_requests")
            .select(`
                id,
                request_id,
                category,
                quantity,
                quantity_unit,
                status,
                created_at,
                quotations (
                    recycler_id,
                    offered_amount,
                    collection_charges,
                    estimated_days,
                    terms,
                    status
                ),
                collections (
                    expected_quantity,
                    collected_quantity,
                    collection_date,
                    verification_status,
                    remarks
                )
            `)
            .eq("college_id", profile.college_id)
            .order("created_at", { ascending: false });

        if (error) {

            console.error(
                "Passport loading error:",
                JSON.stringify(error, null, 2)
            );

            passportContainer.textContent =
                "Unable to load E-Waste Passport records.";

            return;
        }

        passportContainer.replaceChildren();

        if (!passports || passports.length === 0) {

            passportContainer.textContent =
                "No E-Waste Passport records available yet.";

            return;
        }

        passports.forEach(function (request) {

            const card = document.createElement("div");

            card.className = "passport-card";

            // Request details
            const heading = document.createElement("h3");

            heading.textContent =
                "Request ID: " + request.request_id;

            const category = document.createElement("p");

            category.textContent =
                "Category: " + request.category;

            const quantity = document.createElement("p");

            quantity.textContent =
                "Declared Quantity: " +
                request.quantity + " " + request.quantity_unit;

            const requestStatus = document.createElement("p");

            requestStatus.textContent =
                "Request Status: " + request.status;

            card.append(
                heading,
                category,
                quantity,
                requestStatus
            );

            // ==================================
            // QUOTATION HISTORY
            // ==================================

            const quotationHeading =
                document.createElement("h4");

            quotationHeading.textContent =
                "Quotation History";

            card.appendChild(quotationHeading);

            if (
                request.quotations &&
                request.quotations.length > 0
            ) {

                request.quotations.forEach(
                    function (quotation) {

                        const item =
                            document.createElement("p");

                        item.textContent =
                            "Recycler #" + quotation.recycler_id +
                            " | Offered: ₹" +
                            quotation.offered_amount +
                            " | Charges: ₹" +
                            quotation.collection_charges +
                            " | Estimated Days: " +
                            quotation.estimated_days +
                            " | Status: " +
                            quotation.status;

                        card.appendChild(item);
                    }
                );

            } else {

                const item = document.createElement("p");

                item.textContent =
                    "No quotations received yet.";

                card.appendChild(item);
            }

            // ==================================
            // COLLECTION HISTORY
            // ==================================

            const collectionHeading =
                document.createElement("h4");

            collectionHeading.textContent =
                "Collection History";

            card.appendChild(collectionHeading);

            if (
                request.collections &&
                request.collections.length > 0
            ) {

                request.collections.forEach(
                    function (collection) {

                        const item =
                            document.createElement("p");

                        item.textContent =
                            "Expected Quantity: " +
                            collection.expected_quantity +
                            " | Collected Quantity: " +
                            collection.collected_quantity +
                            " | Collection Date: " +
                            collection.collection_date +
                            " | Verification: " +
                            collection.verification_status;

                        card.appendChild(item);

                        // Show quantity difference
                        const difference =
                            Number(collection.expected_quantity) -
                            Number(collection.collected_quantity);

                        const differenceText =
                            document.createElement("p");

                        differenceText.textContent =
                            "Quantity Difference: " +
                            difference + " " +
                            request.quantity_unit;

                        card.appendChild(differenceText);

                        // Show remarks
                        if (collection.remarks) {

                            const remarks =
                                document.createElement("p");

                            remarks.textContent =
                                "Remarks: " + collection.remarks;

                            card.appendChild(remarks);
                        }
                    }
                );

            } else {

                const item = document.createElement("p");

                item.textContent =
                    "Collection not recorded yet.";

                card.appendChild(item);
            }

            passportContainer.appendChild(card);
        });

        console.log(
            "E-Waste Passports displayed:",
            passports.length
        );
    }

    
    // ==========================================
    // LOAD REAL COLLECTION TRACKING
    // ==========================================

    async function loadCollegeTracking() {

        const trackingContainer =
            document.getElementById("trackingContainer");

        const { data: requests, error } = await supabase
            .from("ewaste_requests")
            .select(`
                id,
                request_id,
                category,
                quantity,
                quantity_unit,
                collections (
                    expected_quantity,
                    collected_quantity,
                    collection_date,
                    verification_status,
                    remarks
                )
            `)
            .eq("college_id", profile.college_id)
            .order("created_at", { ascending: false });

        if (error) {

            console.error(
                "Collection tracking error:",
                JSON.stringify(error, null, 2)
            );

            trackingContainer.textContent =
                "Unable to load collection tracking records.";

            return;
        }

        trackingContainer.replaceChildren();

        if (!requests || requests.length === 0) {

            trackingContainer.textContent =
                "No collection records available yet.";

            return;
        }

        requests.forEach(function (request) {

            const card = document.createElement("div");
            card.className = "tracking-card";

            const collections = request.collections || [];

            const expectedQuantity =
                collections.length > 0
                    ? Number(collections[0].expected_quantity)
                    : Number(request.quantity);

            const collectedQuantity =
                collections.reduce(function (total, collection) {
                    return total +
                        Number(collection.collected_quantity || 0);
                }, 0);

            const pendingQuantity = Math.max(
                expectedQuantity - collectedQuantity,
                0
            );

            const hasMismatch = collections.some(function (collection) {
                return collection.verification_status === "review_required";
            });

            const heading = document.createElement("h3");
            heading.textContent =
                request.request_id + " – " + request.category;

            const declared = document.createElement("p");
            declared.textContent =
                "Declared Quantity: " +
                request.quantity + " " + request.quantity_unit;

            const collected = document.createElement("p");
            collected.textContent =
                "Collected Quantity: " +
                collectedQuantity + " " + request.quantity_unit;

            const pending = document.createElement("p");
            pending.textContent =
                "Pending Quantity: " +
                pendingQuantity + " " + request.quantity_unit;

            const status = document.createElement("span");

            if (hasMismatch) {

                status.className = "status review";
                status.textContent = "Mismatch – Under Review";

            } else if (pendingQuantity === 0 && collections.length > 0) {

                status.className = "status completed";
                status.textContent = "Collection Completed";

            } else if (collections.length > 0) {

                status.className = "status pending";
                status.textContent = "Collection In Progress";

            } else {

                status.className = "status pending";
                status.textContent = "Awaiting Collection";
            }

            card.append(
                heading,
                declared,
                collected,
                pending,
                status
            );

            collections.forEach(function (collection) {

                if (collection.collection_date) {

                    const date = document.createElement("p");

                    date.textContent =
                        "Collection Date: " +
                        collection.collection_date;

                    card.appendChild(date);
                }

                if (collection.remarks) {

                    const remarks = document.createElement("p");

                    remarks.textContent =
                        "Remarks: " + collection.remarks;

                    card.appendChild(remarks);
                }
            });

            trackingContainer.appendChild(card);
        });
    }

    // ==========================================
    // LOAD RECYCLING HISTORY
    // ==========================================

    async function loadCollegeHistory() {

        const historyContainer =
            document.getElementById("historyContainer");

        const { data: history, error } = await supabase
            .from("recycling_history")
            .select(`
                id,
                recorded_at,
                request_id,
                recycler_id,
                activity,
                details
            `)
            .order("recorded_at", { ascending: false });

        if (error) {

            console.error(
                "Recycling history error:",
                JSON.stringify(error, null, 2)
            );

            historyContainer.textContent =
                "Unable to load recycling history.";

            return;
        }

        historyContainer.replaceChildren();

        if (!history || history.length === 0) {

            historyContainer.textContent =
                "No recycling history available yet.";

            return;
        }

        history.forEach(function (record) {

            const card = document.createElement("div");
            card.className = "passport-card";

            const activity = document.createElement("h3");
            activity.textContent = record.activity;

            const requestId = document.createElement("p");
            requestId.textContent =
                "Request ID: " + record.request_id;

            const date = document.createElement("p");

            date.textContent =
                "Recorded: " +
                new Date(record.recorded_at).toLocaleString("en-IN");

            const details = document.createElement("p");
            details.textContent =
                "Details: " + (record.details || "No additional details");

            card.append(
                activity,
                requestId,
                date,
                details
            );

            if (record.recycler_id !== null) {

                const recycler = document.createElement("p");

                recycler.textContent =
                    "Recycler ID: " + record.recycler_id;

                card.appendChild(recycler);
            }

            historyContainer.appendChild(card);
        });

        console.log(
            "Recycling history records displayed:",
            history.length
        );
    }

    // ==========================================
    // LOAD COLLEGE OVERVIEW STATISTICS
    // ==========================================

    async function loadCollegeStats() {

        const { data: requests, error } = await supabase
            .from("ewaste_requests")
            .select(`
                status,
                quantity,
                collections (
                    collected_quantity
                )
            `)
            .eq("college_id", profile.college_id);

        if (error) {
            console.error(
                "College statistics error:",
                JSON.stringify(error, null, 2)
            );
            return;
        }

        const totalRequests = requests.length;

        const pendingRequests = requests.filter(function (request) {
            return request.status === "pending";
        }).length;

        let completedCollections = 0;
        let pendingCollections = 0;

        requests.forEach(function (request) {

            const collected = (request.collections || [])
                .reduce(function (total, collection) {
                    return total +
                        Number(collection.collected_quantity || 0);
                }, 0);

            const declared = Number(request.quantity);

            if (collected >= declared && collected > 0) {
                completedCollections++;
            } else {
                pendingCollections++;
            }
        });

        document.getElementById("totalCollegeRequests")
            .textContent = totalRequests;

        document.getElementById("pendingCollegeRequests")
            .textContent = pendingRequests;

        document.getElementById("completedCollegeCollections")
            .textContent = completedCollections;

        document.getElementById("pendingCollegeCollections")
            .textContent = pendingCollections;

        console.log("College overview statistics updated.");
    }

    // ==========================================
    // LOAD DYNAMIC RECYCLING REPORTS
    // ==========================================

    async function loadCollegeReports() {

        const reportContainer =
            document.getElementById("reportRequestsContainer");

        const { data: requests, error } = await supabase
            .from("ewaste_requests")
            .select(`
                request_id,
                category,
                quantity,
                quantity_unit,
                status,
                quotations (
                    id,
                    offered_amount,
                    status
                ),
                collections (
                    id,
                    collected_quantity,
                    expected_quantity,
                    verification_status
                )
            `)
            .eq("college_id", profile.college_id)
            .order("created_at", { ascending: false });

        if (error) {

            console.error(
                "Recycling reports error:",
                JSON.stringify(error, null, 2)
            );

            reportContainer.textContent =
                "Unable to load recycling reports.";

            return;
        }

        const totalQuotations = requests.reduce(
            (total, request) =>
                total + (request.quotations || []).length,
            0
        );

        const acceptedQuotations = requests.reduce(
            (total, request) =>
                total + (request.quotations || []).filter(
                    quotation => quotation.status === "accepted"
                ).length,
            0
        );

        const collectionsRecorded = requests.reduce(
            (total, request) =>
                total + (request.collections || []).length,
            0
        );

        const mismatches = requests.reduce(
            (total, request) =>
                total + (request.collections || []).filter(
                    collection =>
                        collection.verification_status === "review_required"
                ).length,
            0
        );

        document.getElementById("reportTotalQuotations")
            .textContent = totalQuotations;

        document.getElementById("reportAcceptedQuotations")
            .textContent = acceptedQuotations;

        document.getElementById("reportCollectionsRecorded")
            .textContent = collectionsRecorded;

        document.getElementById("reportMismatches")
            .textContent = mismatches;

        // Request-wise recycling report
        reportContainer.replaceChildren();

        if (!requests || requests.length === 0) {

            reportContainer.textContent =
                "No recycling report data available.";

            return;
        }

        requests.forEach(function (request) {

            const card = document.createElement("div");
            card.className = "tracking-card";

            const heading = document.createElement("h3");
            heading.textContent =
                request.request_id + " – " + request.category;

            const declared = document.createElement("p");
            declared.textContent =
                "Declared Quantity: " +
                request.quantity + " " + request.quantity_unit;

            const quotations = request.quotations || [];
            const collections = request.collections || [];

            const quotationText = document.createElement("p");
            quotationText.textContent =
                "Total Quotations: " + quotations.length;

            const acceptedText = document.createElement("p");
            acceptedText.textContent =
                "Accepted Quotations: " +
                quotations.filter(q => q.status === "accepted").length;

            const collectedQuantity = collections.reduce(
                (total, collection) =>
                    total + Number(collection.collected_quantity || 0),
                0
            );

            const collectedText = document.createElement("p");
            collectedText.textContent =
                "Total Collected: " +
                collectedQuantity + " " + request.quantity_unit;

            const difference = document.createElement("p");
            difference.textContent =
                "Pending Quantity: " +
                Math.max(Number(request.quantity) - collectedQuantity, 0) +
                " " + request.quantity_unit;

            const status = document.createElement("p");
            status.textContent =
                "Request Status: " + request.status;

            card.append(
                heading,
                declared,
                quotationText,
                acceptedText,
                collectedText,
                difference,
                status
            );

            reportContainer.appendChild(card);
        });

        console.log("Recycling reports successfully loaded.");
    }

    // ==========================================
    // 7. HANDLE NEW E-WASTE REQUEST SUBMISSION
    // ==========================================

    const requestForm =
        document.getElementById("requestForm");

    requestForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const requestMessage =
                document.getElementById("requestMessage");

            const submitButton =
                requestForm.querySelector(
                    'button[type="submit"]'
                );

            submitButton.disabled = true;

            requestMessage.textContent =
                "Submitting your request...";

            const request = {

                college_id: profile.college_id,

                category:
                    document.getElementById("requestCategory").value,

                quantity:
                    Number(
                        document.getElementById("requestQuantity").value
                    ),

                quantity_unit:
                    document.getElementById("quantityUnit").value,

                contact_phone:
                    document.getElementById("requestPhone").value.trim(),

                collection_location:
                    document.getElementById("requestLocation").value.trim(),

                device_condition:
                    document.getElementById("requestCondition").value || null,

                description:
                    document.getElementById("requestNotes").value.trim() || null,

                status: "pending"
            };
            // Debug college request submission
const {
    data: { user: currentUser }
} = await supabase.auth.getUser();

console.log("CURRENT AUTH UID:", currentUser?.id);

console.log("COLLEGE PROFILE:", {
    user_id: profile.user_id,
    role: profile.role,
    college_id: profile.college_id
});

console.log("REQUEST INSERT PAYLOAD:", request);

            const { data: newRequest, error: requestError } =
                await supabase
                    .from("ewaste_requests")
                    .insert(request)
                    .select("request_id")
                    .single();

            submitButton.disabled = false;

            if (requestError) {

                console.error(
                    "Request submission error:",
                    JSON.stringify(requestError, null, 2)
                );

                requestMessage.textContent =
                    "Unable to submit request. Please try again.";

                return;
            }

            requestMessage.textContent =
                "Request submitted successfully! Your Request ID is " +
                newRequest.request_id;

            requestForm.reset();

            await loadCollegeRequests();

            await loadCollegePassports();
        }
    );


    // ==========================================
    // 8. LOAD DASHBOARD DATA WHEN PAGE OPENS
    // ==========================================

    await loadCollegeRequests();
    await loadCollegeQuotations();
    await loadCollegePassports();
    await loadCollegeTracking();
    await loadCollegeHistory();
    await loadCollegeStats();
    await loadCollegeReports();
}


// ==============================================
// 9. LOGOUT
// ==============================================

document
    .getElementById("logoutButton")
    .addEventListener("click", async function () {

        const { error } = await supabase.auth.signOut();

        if (error) {

            alert("Logout failed. Please try again.");

            console.error("Logout error:", error);

            return;
        }

        window.location.href = "college-login.html";
    });


// ==============================================
// 10. START COLLEGE DASHBOARD
// ==============================================

loadCollegeDashboard();
