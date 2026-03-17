(function () {
	var endpoint = window.MT_SUBSCRIBE_ENDPOINT || "/api/subscribe";
	var forms = document.querySelectorAll("[data-subscribe-form]");

	function setMessage(target, text, tone) {
		if (!target) return;
		target.textContent = text || "";
		target.className = "subscribe-message";
		if (tone) target.classList.add("is-" + tone);
	}

	function normalizeError(message) {
		if (!message) return "No se pudo completar la suscripcion. Intenta de nuevo.";
		if (/already exists|duplicate|already subscribed/i.test(message)) {
			return "Ese correo ya esta suscrito a EN FRIO.";
		}
		return message;
	}

	for (var i = 0; i < forms.length; i += 1) {
		(function (form) {
			var message = form.querySelector("[data-subscribe-message]");
			var submit = form.querySelector('button[type="submit"]');

			form.addEventListener("submit", async function (event) {
				event.preventDefault();

				var emailInput = form.querySelector('input[name="email"]');
				var email = emailInput ? emailInput.value.trim() : "";
				if (!email) {
					setMessage(message, "Escribe un correo valido.", "error");
					return;
				}

				setMessage(message, "Suscribiendo...", "pending");
				if (submit) submit.disabled = true;

				try {
					var response = await fetch(endpoint, {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify({
							email: email,
							source: form.getAttribute("data-source") || "website"
						})
					});

					var payload = await response.json().catch(function () {
						return {};
					});

					if (!response.ok) {
						throw new Error(payload.error || "No se pudo completar la suscripcion.");
					}

					form.reset();
					setMessage(message, payload.message || "Listo. Revisa tu correo para confirmar la suscripcion.", "success");
				} catch (error) {
					setMessage(message, normalizeError(error.message), "error");
				} finally {
					if (submit) submit.disabled = false;
				}
			});
		})(forms[i]);
	}
})();
