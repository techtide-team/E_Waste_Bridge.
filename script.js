
/* =====================================
   E-WASTE BRIDGE - JAVASCRIPT
===================================== */

document.addEventListener("DOMContentLoaded", function () {

    // 1. LOADING SCREEN

    const loader = document.getElementById("loader");

    window.addEventListener("load", function () {
        setTimeout(function () {
            loader.classList.add("hidden");
        }, 1200);
    });

    // Fallback in case the page load event already happened
    setTimeout(function () {
        loader.classList.add("hidden");
    }, 2500);


    // 2. NAVBAR SCROLL EFFECT

    const navbar = document.getElementById("navbar");

    window.addEventListener("scroll", function () {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });


    // 3. MOBILE MENU

    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    menuToggle.addEventListener("click", function () {
        const isOpen = navLinks.classList.toggle("open");

        menuToggle.setAttribute("aria-expanded", isOpen);
    });

    document.querySelectorAll(".nav-links a").forEach(function (link) {
        link.addEventListener("click", function () {
            navLinks.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
        });
    });


    // 4. TYPING ANIMATION

    const typingText = document.getElementById("typingText");

    const words = [
        "Recycle.",
        "Refurbish.",
        "Reconnect.",
        "Reimagine."
    ];

    let wordIndex = 0;
    let letterIndex = 0;
    let deleting = false;

    function typeEffect() {

        const currentWord = words[wordIndex];

        if (deleting) {
            letterIndex--;
        } else {
            letterIndex++;
        }

        typingText.textContent =
            currentWord.substring(0, letterIndex);

        let delay = deleting ? 55 : 100;

        if (!deleting && letterIndex === currentWord.length) {
            deleting = true;
            delay = 1400;
        }

        else if (deleting && letterIndex === 0) {
            deleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            delay = 400;
        }

        setTimeout(typeEffect, delay);
    }

    typeEffect();


    // 5. SCROLL REVEAL ANIMATION

    const revealElements = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {

        const revealObserver = new IntersectionObserver(
            function (entries, observer) {

                entries.forEach(function (entry) {

                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }

                });

            },
            {
                threshold: 0.12
            }
        );

        revealElements.forEach(function (element) {
            revealObserver.observe(element);
        });

    } else {

        revealElements.forEach(function (element) {
            element.classList.add("visible");
        });

    }


    // 6. CATEGORY FILTER

    const filterButtons = document.querySelectorAll(".filter-btn");
    const categoryCards = document.querySelectorAll(".category-card");

    filterButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const selectedCategory = button.dataset.filter;

            filterButtons.forEach(function (btn) {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            categoryCards.forEach(function (card) {

                const cardCategory = card.dataset.category;

                if (
                    selectedCategory === "all" ||
                    selectedCategory === cardCategory
                ) {
                    card.classList.remove("hide");
                } else {
                    card.classList.add("hide");
                }

            });

        });

    });


    // 7. ANIMATED STATISTICS

    const counters = document.querySelectorAll(".counter");

    function animateCounter(counter) {

        const target = Number(counter.dataset.target);
        const suffix = counter.dataset.suffix || "";

        const duration = 1500;
        const startTime = performance.now();

        function updateCounter(currentTime) {

            const progress = Math.min(
                (currentTime - startTime) / duration,
                1
            );

            const easedProgress = 1 - Math.pow(1 - progress, 3);

            const currentValue = Math.floor(
                easedProgress * target
            );

            counter.textContent =
                currentValue.toLocaleString("en-IN") + suffix;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }

        }

        requestAnimationFrame(updateCounter);
    }

    const counterObserver = new IntersectionObserver(
        function (entries, observer) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {

                    animateCounter(entry.target);

                    observer.unobserve(entry.target);

                }

            });

        },
        {
            threshold: 0.5
        }
    );

    counters.forEach(function (counter) {
        counterObserver.observe(counter);
    });


    // 8. PROGRESS BAR

    const progressFill = document.querySelector(".progress-fill");

    const progressObserver = new IntersectionObserver(
        function (entries, observer) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {
                    progressFill.style.width = "75%";
                    observer.unobserve(entry.target);
                }

            });

        },
        {
            threshold: 0.5
        }
    );

    progressObserver.observe(progressFill);


    // 9. 3D HOVER EFFECT

    const tiltCards = document.querySelectorAll(
        ".category-card, .step-card, .stat-card"
    );

    const supportsHover = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    ).matches;

    if (supportsHover) {

        tiltCards.forEach(function (card) {

            card.addEventListener("mousemove", function (event) {

                const rect = card.getBoundingClientRect();

                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (centerY - y) / 22;
                const rotateY = (x - centerX) / 22;

                card.style.transform =
                    "perspective(800px) rotateX(" +
                    rotateX + "deg) rotateY(" +
                    rotateY + "deg) translateY(-3px)";

            });

            card.addEventListener("mouseleave", function () {
                card.style.transform = "";
            });

        });

    }


    // 10. IMAGE UPLOAD PREVIEW

    const uploadArea = document.getElementById("uploadArea");
    const uploadButton = document.getElementById("uploadButton");
    const imageUpload = document.getElementById("imageUpload");
    const imagePreview = document.getElementById("imagePreview");
    const classificationResult = document.getElementById(
        "classificationResult"
    );

    uploadButton.addEventListener("click", function (event) {
        event.stopPropagation();
        imageUpload.click();
    });

    uploadArea.addEventListener("click", function (event) {

        if (
            event.target !== uploadButton &&
            event.target !== imageUpload
        ) {
            imageUpload.click();
        }

    });

    uploadArea.addEventListener("dragover", function (event) {
        event.preventDefault();
        uploadArea.classList.add("dragging");
    });

    uploadArea.addEventListener("dragleave", function () {
        uploadArea.classList.remove("dragging");
    });

    uploadArea.addEventListener("drop", function (event) {

        event.preventDefault();
        uploadArea.classList.remove("dragging");

        const file = event.dataTransfer.files[0];

        showImagePreview(file);

    });

    imageUpload.addEventListener("change", function () {

        const file = imageUpload.files[0];

        showImagePreview(file);

    });

    function showImagePreview(file) {

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showToast("Please select an image file.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast("Please select an image smaller than 5 MB.");
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            imagePreview.src = event.target.result;
            imagePreview.classList.add("visible");

            classificationResult.innerHTML = `
                <span>IMAGE RECEIVED</span>
                <p>Image preview loaded successfully. AI classification
                is not connected in this prototype.</p>
            `;

            showToast("Image preview loaded successfully!");

        };

        reader.readAsDataURL(file);
    }


    // 11. TOAST NOTIFICATION

    const toast = document.getElementById("toast");

    let toastTimer;

    function showToast(message) {

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(function () {
            toast.classList.remove("show");
        }, 3000);

    }


    


    // 14. BACK TO TOP

    const backToTop = document.getElementById("backToTop");

    window.addEventListener("scroll", function () {

        if (window.scrollY > 450) {
            backToTop.classList.add("visible");
        } else {
            backToTop.classList.remove("visible");
        }

    });

    backToTop.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });


    // 15. ACTIVE NAVIGATION LINK

    const sections = document.querySelectorAll(
        "main section[id]"
    );

    const navItems = document.querySelectorAll(".nav-links a");

    if ("IntersectionObserver" in window) {

        const sectionObserver = new IntersectionObserver(
            function (entries) {

                entries.forEach(function (entry) {

                    if (entry.isIntersecting) {

                        navItems.forEach(function (link) {

                            link.classList.remove("active");

                            if (
                                link.getAttribute("href") ===
                                "#" + entry.target.id
                            ) {
                                link.classList.add("active");
                            }

                        });

                    }

                });

            },
            {
                rootMargin: "-30% 0px -60% 0px"
            }
        );

        sections.forEach(function (section) {
            sectionObserver.observe(section);
        });

    }


    // 16. INITIALIZATION MESSAGE

    console.log(
        "%c E-WASTE BRIDGE ",
        "background:#c5ff55;color:#08130f;font-size:18px;font-weight:bold;padding:8px;"
    );

    console.log("Frontend initialized successfully.");
    console.log(
    "%c E-WASTE BRIDGE ",
    "background:#c5ff55;color:#08130f;font-size:18px;font-weight:bold;padding:8px;"
);

console.log("Frontend initialized successfully.");

});
