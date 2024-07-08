// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email#basic_validation
const emailPattern =
	/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function validateEmailFormat(email: string) {
	if (!email) return 'Email is required';

	if (!emailPattern.test(email)) return 'Please enter a valid email address.';

	return undefined;
}

function validatePasswordFormat(password: string) {
	if (!password) return 'Password is required.';

	if (password.length < 6) return 'Password must be at least 6 characters.';

	return undefined;
}

export { validateEmailFormat, validatePasswordFormat };
