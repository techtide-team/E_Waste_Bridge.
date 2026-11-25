
import { supabase } from "./supabase.js";

async function loadRecyclerDashboard() {

    // ==========================================
    // 1. VARIABLES
    // ==========================================

    let selectedRequestId = null;
    let selectedCollectionRequestId = null;
    let selectedCollectionRequest = null;
    let isCollectionSubmitting = false;


    // ==========================================
    // 2. CHECK RECYCLER LOGIN
    // ==========================================

    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
        window.location.href = "recycler-login.html";
        return;
    }


    // ==========================================
    // 3. GET RECYCLER PROFILE
    // ==========================================

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, recycler_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (
        profileError ||
        !profile ||
        profile.role !== "recycler" ||
        !profile.recycler_id
    ) {

        console.error("Recycler profile error:", profileError);

        alert("Recycler account not found. Please log in again.");

        await supabase.auth.signOut();

        window.location.href = "recycler-login.html";
        return;
    }


    // ==========================================
    // 4. LOAD AVAILABLE COLLEGE REQUESTS
    // ==========================================

    async function loadAvailableRequests() {

        const tableBody =
            document.getElementById("recyclerRequestsBody");

        const { data: requests, error: requestError } =
            await supabase
                .from("ewaste_requests")
                .select(`
                    id,
                    request_id,
                    category,
                    quantity,
                    quantity_unit,
                    collection_location,
                    status,
                    colleges ( college_name )
                `)
                .eq("status", "pending")
                .order("created_at", { ascending: false });

        if (requestError) {

            console.error(
                "AVAILABLE REQUEST ERROR:\n" +
                JSON.stringify(requestError, null, 2)
            );

            tableBody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 7;
            cell.textContent = "Unable to load requests.";

            row.appendChild(cell);
            tableBody.appendChild(row);

            return;
        }

        document.getElementById("totalRequests").textContent =
            requests.length;

        tableBody.replaceChildren();

        if (requests.length === 0) {

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 7;
            cell.textContent =
                "No available requests currently.";

            row.appendChild(cell);
            tableBody.appendChild(row);

            return;
        }

        requests.forEach(function (request) {

            const row = document.createElement("tr");

            const values = [
                request.request_id,
                request.colleges?.college_name || "College",
                request.category,
                request.quantity + " " + request.quantity_unit,
                request.collection_location || "Not provided",
                request.status
            ];

            values.forEach(function (value) {

                const cell = document.createElement("td");

                cell.textContent = value;

                row.appendChild(cell);
            });

            // View Details button
            const actionCell = document.createElement("td");

            const viewButton =
                document.createElement("button");

            viewButton.type = "button";
            viewButton.textContent = "View Details";

            viewButton.addEventListener("click", function () {

                selectedRequestId = request.id;

                document.getElementById("selectedRequestInfo")
                    .textContent =
                    "Request: " + request.request_id +
                    " | Category: " + request.category +
                    " | Quantity: " +
                    request.quantity + " " +
                    request.quantity_unit;

                document.getElementById("quotationForm").reset();

                document.getElementById("quotationMessage")
                    .textContent = "";

                const quotationSection =
                    document.getElementById("quotationSection");

                quotationSection.hidden = false;

                quotationSection.scrollIntoView({
                    behavior: "smooth"
                });
            });

            actionCell.appendChild(viewButton);
            row.appendChild(actionCell);

            tableBody.appendChild(row);
        });
    }


    // ==========================================
    // 5. LOAD ASSIGNED REQUESTS
    // ==========================================

    async function loadAssignedRequests() {

        const assignedBody =
            document.getElementById("assignedRequestsBody");

        const { data: assignedRequests, error } =
            await supabase
                .from("ewaste_requests")
                .select(`
                    id,
                    request_id,
                    category,
                    quantity,
                    quantity_unit,
                    collection_location,
                    status,
                    created_at,
                    colleges ( college_name )
                `)
                .eq("status", "assigned")
                .order("created_at", { ascending: false });

        if (error) {

            console.error(
                "ASSIGNED REQUEST ERROR:\n" +
                JSON.stringify(error, null, 2)
            );

            assignedBody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 7;
            cell.textContent =
                "Unable to load assigned requests.";

            row.appendChild(cell);
            assignedBody.appendChild(row);

            return;
        }

        // Check previously recorded collections
        const { data: collectionHistory, error: historyError } =
            await supabase
                .from("recycling_history")
                .select("request_id")
                .eq("recycler_id", profile.recycler_id)
                .eq("activity", "Collection recorded");

        if (historyError) {

            console.error(
                "Collection history check error:",
                JSON.stringify(historyError, null, 2)
            );

            assignedBody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 7;
            cell.textContent =
                "Unable to verify existing collection records.";

            row.appendChild(cell);
            assignedBody.appendChild(row);

            return;
        }

        const recordedCollectionRequestIds = new Set(
            collectionHistory.map(function (item) {
                return String(item.request_id);
            })
        );

        assignedBody.replaceChildren();

        if (!assignedRequests || assignedRequests.length === 0) {

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 7;
            cell.textContent =
                "No requests assigned to you yet.";

            row.appendChild(cell);
            assignedBody.appendChild(row);

            return;
        }

        assignedRequests.forEach(function (request) {

            const row = document.createElement("tr");

            const values = [
                request.request_id,
                request.colleges?.college_name || "College",
                request.category,
                request.quantity + " " + request.quantity_unit,
                request.collection_location || "Not provided",
                request.status
            ];

            values.forEach(function (value) {

                const cell = document.createElement("td");

                cell.textContent = value;

                row.appendChild(cell);
            });

            // Collection Action
            const actionCell = document.createElement("td");

            const alreadyRecorded =
                recordedCollectionRequestIds.has(
                    String(request.id)
                );

            if (alreadyRecorded) {

                actionCell.textContent = "Collection Recorded";

            } else {

                const recordButton =
                    document.createElement("button");

                recordButton.type = "button";
                recordButton.textContent = "Record Collection";

                recordButton.addEventListener(
                    "click",
                    function () {

                        selectedCollectionRequestId = request.id;
                        selectedCollectionRequest = request;

                        document.getElementById(
                            "selectedCollectionRequestInfo"
                        ).textContent =
                            "Request: " + request.request_id +
                            " | Category: " + request.category +
                            " | Declared Quantity: " +
                            request.quantity + " " +
                            request.quantity_unit;

                        document.getElementById(
                            "collectionMessage"
                        ).textContent = "";

                        const collectionSection =
                            document.getElementById(
                                "collectionSection"
                            );

                        collectionSection.hidden = false;

                        collectionSection.scrollIntoView({
                            behavior: "smooth"
                        });
                    }
                );

                actionCell.appendChild(recordButton);
            }

            row.appendChild(actionCell);

            assignedBody.appendChild(row);
        });
    }


    // ==========================================
    // 6. LOAD RECYCLER MY ACTIVITIES
    // ==========================================

    async function loadRecyclerHistory() {

        const historyContainer =
            document.getElementById("recyclerHistoryContainer");

        const { data: history, error } = await supabase
            .from("recycling_history")
            .select(`
                id,
                recorded_at,
                request_id,
                recycler_id,
                activity,
                details,
                ewaste_requests ( request_id )
            `)
            .eq("recycler_id", profile.recycler_id)
            .order("recorded_at", { ascending: false });

        if (error) {

            console.error(
                "RECYCLER HISTORY ERROR:\n" +
                JSON.stringify(error, null, 2)
            );

            historyContainer.textContent =
                "Unable to load recycling activities.";

            return;
        }

        historyContainer.replaceChildren();

        if (!history || history.length === 0) {

            historyContainer.textContent =
                "No recycling activities recorded yet.";

            return;
        }

        history.forEach(function (record) {

            const card = document.createElement("div");

            card.className = "passport-card";

            const heading = document.createElement("h3");

            heading.textContent = record.activity;

            const requestText = document.createElement("p");

            requestText.textContent =
                "Request ID: " +
                (
                    record.ewaste_requests?.request_id ||
                    record.request_id
                );

            const date = document.createElement("p");

            date.textContent =
                "Recorded: " +
                new Date(record.recorded_at)
                    .toLocaleString("en-IN");

            const details = document.createElement("p");

            details.textContent =
                "Details: " +
                (record.details || "No additional details");

            card.append(
                heading,
                requestText,
                date,
                details
            );

            historyContainer.appendChild(card);
        });
    }


    // ==========================================
    // 7. QUOTATION SUBMISSION
    // ==========================================

    const quotationForm =
        document.getElementById("quotationForm");

    quotationForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const quotationMessage =
                document.getElementById("quotationMessage");

            const submitButton =
                quotationForm.querySelector(
                    'button[type="submit"]'
                );

            if (!selectedRequestId) {

                quotationMessage.textContent =
                    "Please select a college request first.";

                return;
            }

            const offeredAmount = Number(
                document.getElementById("offeredAmount").value
            );

            const collectionCharges = Number(
                document.getElementById("collectionCharges").value
            );

            const estimatedDays = Number(
                document.getElementById("estimatedDays").value
            );

            if (
                !Number.isFinite(offeredAmount) ||
                offeredAmount <= 0 ||
                !Number.isFinite(collectionCharges) ||
                collectionCharges < 0 ||
                !Number.isInteger(estimatedDays) ||
                estimatedDays < 1
            ) {

                quotationMessage.textContent =
                    "Please enter valid quotation details.";

                return;
            }

            const quotation = {

                request_id: selectedRequestId,

                recycler_id: profile.recycler_id,

                offered_amount: offeredAmount,

                collection_charges: collectionCharges,

                estimated_days: estimatedDays,

                status: "pending",

                terms: document.getElementById(
                    "quotationTerms"
                ).value.trim()
            };

            submitButton.disabled = true;

            quotationMessage.textContent =
                "Submitting quotation...";

            const { error } = await supabase
                .from("quotations")
                .insert(quotation);

            submitButton.disabled = false;

            if (error) {

                console.error(
                    "QUOTATION SUBMISSION ERROR:\n" +
                    JSON.stringify(error, null, 2)
                );

                quotationMessage.textContent =
                    "Unable to submit quotation. Please try again.";

                return;
            }

            quotationMessage.textContent =
                "Quotation submitted successfully!";

            quotationForm.reset();

            selectedRequestId = null;

            await loadRecyclerHistory();

        }
    );


    // ==========================================
    // 8. CANCEL QUOTATION FORM
    // ==========================================

    document.getElementById("cancelQuotation")
        .addEventListener("click", function () {

            quotationForm.reset();

            selectedRequestId = null;

            document.getElementById(
                "quotationSection"
            ).hidden = true;

            document.getElementById(
                "quotationMessage"
            ).textContent = "";

        });


    // ==========================================
    // 9. COLLECTION SUBMISSION
    // ==========================================

    const collectionForm =
        document.getElementById("collectionForm");

    collectionForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            if (isCollectionSubmitting) {
                return;
            }

            const collectionMessage =
                document.getElementById("collectionMessage");

            const submitButton =
                collectionForm.querySelector(
                    'button[type="submit"]'
                );

            if (
                !selectedCollectionRequestId ||
                !selectedCollectionRequest
            ) {

                collectionMessage.textContent =
                    "Please select an assigned request first.";

                return;
            }

            const collectedQuantity = Number(
                document.getElementById("collectedQuantity").value
            );

            const expectedQuantity =
                Number(selectedCollectionRequest.quantity);

            if (
                !Number.isFinite(collectedQuantity) ||
                collectedQuantity < 0 ||
                !Number.isFinite(expectedQuantity)
            ) {

                collectionMessage.textContent =
                    "Please enter a valid collected quantity.";

                return;
            }

            // Prevent repeated submissions
            isCollectionSubmitting = true;

            submitButton.disabled = true;

            collectionMessage.textContent =
                "Checking existing collection records...";

            try {

                // Check if this request already has a collection
                const { data: existingRecords, error: checkError } =
                    await supabase
                        .from("recycling_history")
                        .select("id")
                        .eq("request_id", selectedCollectionRequestId)
                        .eq("recycler_id", profile.recycler_id)
                        .eq("activity", "Collection recorded")
                        .limit(1);

                if (checkError) {

                    console.error(
                        "DUPLICATE COLLECTION CHECK ERROR:\n" +
                        JSON.stringify(checkError, null, 2)
                    );

                    collectionMessage.textContent =
                        "Unable to verify existing collection records.";

                    return;
                }

                if (existingRecords && existingRecords.length > 0) {

                    collectionMessage.textContent =
                        "A collection has already been recorded for this request.";

                    selectedCollectionRequestId = null;
                    selectedCollectionRequest = null;

                    await loadAssignedRequests();

                    return;
                }

                const collection = {

                    request_id: selectedCollectionRequestId,

                    recycler_id: profile.recycler_id,

                    expected_quantity: expectedQuantity,

                    collected_quantity: collectedQuantity,

                    collection_date:
                        document.getElementById(
                            "collectionDate"
                        ).value,

                    verification_status:
                        collectedQuantity === expectedQuantity
                            ? "verified"
                            : "review_required",

                    remarks:
                        document.getElementById(
                            "collectionRemarks"
                        ).value.trim() || null
                };

                collectionMessage.textContent =
                    "Saving collection...";

                const { error: collectionError } = await supabase
                    .from("collections")
                    .insert(collection);

                if (collectionError) {

                    console.error(
                        "COLLECTION SUBMISSION ERROR:\n" +
                        JSON.stringify(
                            collectionError,
                            null,
                            2
                        )
                    );

                    collectionMessage.textContent =
                        "Unable to save collection. Please try again.";

                    return;
                }

                // Successful collection
                collectionMessage.textContent =
                    collectedQuantity === expectedQuantity
                        ? "Collection saved successfully! Quantity verified."
                        : "Collection saved! Quantity mismatch flagged for review.";

                collectionForm.reset();

                selectedCollectionRequestId = null;
                selectedCollectionRequest = null;

                document.getElementById(
                    "collectionSection"
                ).hidden = true;

                // Refresh assigned requests and activity history
                await loadAssignedRequests();

                await loadRecyclerHistory();

            } catch (unexpectedError) {

                console.error(
                    "UNEXPECTED COLLECTION ERROR:",
                    unexpectedError
                );

                collectionMessage.textContent =
                    "Something went wrong. Please check the Console.";

            } finally {

                // Always unlock the form
                isCollectionSubmitting = false;

                submitButton.disabled = false;
            }

        }
    );


    // ==========================================
    // 10. CANCEL COLLECTION FORM
    // ==========================================

    document.getElementById("cancelCollection")
        .addEventListener("click", function () {

            if (isCollectionSubmitting) {
                return;
            }

            collectionForm.reset();

            selectedCollectionRequestId = null;
            selectedCollectionRequest = null;

            document.getElementById(
                "collectionSection"
            ).hidden = true;

            document.getElementById(
                "collectionMessage"
            ).textContent = "";

        });


    // ==========================================
    // 11. LOAD DASHBOARD DATA
    // ==========================================

    await loadAvailableRequests();

    await loadAssignedRequests();

    await loadRecyclerHistory();

}


// ==============================================
// 12. LOGOUT
// ==============================================

document.getElementById("logoutButton")
    .addEventListener("click", async function () {

        const { error } = await supabase.auth.signOut();

        if (error) {

            alert("Logout failed. Please try again.");

            console.error("Logout error:", error);

            return;
        }

        window.location.href = "recycler-login.html";

    });


// ==============================================
// 13. START RECYCLER DASHBOARD
// ==============================================

loadRecyclerDashboard().catch(function (error) {

    console.error(
        "RECYCLER DASHBOARD INITIALIZATION ERROR:",
        error
    );

});
