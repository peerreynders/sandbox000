// file: src/components/form-validation.ts
import { createStore, unwrap } from 'solid-js/store';

type Validator =
	| ((element: HTMLInputElement) => string | undefined)
	| ((element: HTMLInputElement) => Promise<string | undefined>);

type Field = {
	element: HTMLInputElement;
	validators: Array<Validator>;
	onBlur: ((e: FocusEvent) => void) | undefined;
	onInput: ((e: Event) => void) | undefined;
};

type Errors = Record<string, string>; // [element.name]: error-message

async function checkValidity(
	{ element, validators = [] }: Field,
	assertError: (ref: HTMLInputElement, message: string) => void
) {
	// run native constraint API checks first
	element.setCustomValidity('');
	element.checkValidity();
	let message: string | undefined = element.validationMessage;

	// Only check custom validators if no native constraints have been violated
	if (!message) {
		for (let i = 0; i < validators.length; i += 1) {
			message = await validators[i](element);
			if (!message) continue;

			element.setCustomValidity(message);
			break;
		}
	}

	if (message) assertError(element, message);
}

function useFormValidation({ errorToken }: { errorToken: string }) {
	let formInfo:
		| { ref: HTMLFormElement; onSubmit: (e: SubmitEvent) => Promise<void> }
		| undefined;
	// form fields (and their custom validators) registered by `validate`
	// keyed by their name prop.
	const fields: Array<Field> = [];
	// Store holding `[element.name]: error-message` from the last
	// validation cycle
	const [errors, setErrors] = createStore<Errors>({});
	const assertError = (ref: HTMLInputElement, message: string) => {
		setErrors(ref.name, message);
		errorToken && ref.classList.toggle(errorToken, true);
	};
	const clearError = (ref: HTMLInputElement) => {
		setErrors(ref.name, undefined!);
		errorToken && ref.classList.toggle(errorToken, false);
	};

	function validate(ref: HTMLInputElement, validators: Array<Validator> = []) {
		const name = ref.name;
		const info: Field = {
			element: ref,
			validators,
			onBlur: (_e) => checkValidity(info, assertError),
			onInput: (_e) => {
				if (!errors[name]) return;

				clearError(ref);
			},
		};
		fields.push(info);
		ref.addEventListener('blur', info.onBlur!);
		ref.addEventListener('input', info.onInput!);
	}

	function submit(
		ref: HTMLFormElement,
		submitValidForm: (e: HTMLFormElement) => void = () => void 0
	) {
		ref.noValidate = true;
		if (formInfo) formInfo.ref.removeEventListener('submit', formInfo.onSubmit);

		formInfo = {
			ref,
			onSubmit: async function submit(e) {
				e.preventDefault();
				let errored = false;
				for (let i = 0; i < fields.length; i += 1) {
					const info = fields[i];
					await checkValidity(info, assertError);
					if (errored || !info.element.validationMessage) continue;

					info.element.focus();
					errored = true;
				}
				!errored && submitValidForm(ref);
			},
		};
		ref.addEventListener('submit', formInfo.onSubmit);
	}

	function cleanup() {
		if (formInfo) {
			formInfo.ref.removeEventListener('submit', formInfo.onSubmit);
			formInfo = undefined;
		}

		for (let i = 0; i < fields.length; i += 1) {
			const info = fields[i];
			if (info.onBlur) {
				info.element.removeEventListener('blur', info.onBlur);
				info.onBlur = undefined;
			}
			if (info.onInput) {
				info.element.removeEventListener('input', info.onInput);
				info.onInput = undefined;
			}
		}
		fields.splice(0, Infinity);
	}

	return {
		cleanup,
		errors,
		submit,
		validate,
	};
}

export { useFormValidation };
