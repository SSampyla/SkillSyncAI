const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

async function apiRequest(path, options = {}) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		headers: {
			"Content-Type": "application/json",
			...(options.headers || {}),
		},
		...options,
	});

	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}`;
		try {
			const errorBody = await response.json();
			if (errorBody?.error) {
				errorMessage = errorBody.error;
			}
		} catch {
			// Ignore JSON parse failures and keep HTTP status message.
		}

		throw new Error(errorMessage);
	}

	return response.json();
}

export function searchJobs(criteria) {
	return apiRequest("/jobs/search", {
		method: "POST",
		body: JSON.stringify(criteria),
	});
}

export function generateCoverLetterDraft(payload) {
	return apiRequest("/jobs/letter", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export function generateEditedCvDraft(payload) {
	return apiRequest("/cv/edit", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}
