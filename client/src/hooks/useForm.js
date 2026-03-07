import { useState, useCallback } from 'react';

/**
 * Validation rules
 */
const validators = {
  required: (value) => {
    if (value === undefined || value === null || value === '') {
      return 'This field is required';
    }
    return null;
  },
  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },
  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
    if (!phoneRegex.test(value)) {
      return 'Please enter a valid phone number';
    }
    return null;
  },
  url: (value) => {
    if (!value) return null;
    try {
      new URL(value.startsWith('http') ? value : `https://${value}`);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },
  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },
  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },
  positiveNumber: (value) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return 'Please enter a positive number';
    }
    return null;
  },
};

/**
 * Custom hook for form validation
 */
export function useFormValidation(initialValues, validationRules = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name);
  }, [values, validationRules]);

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validateField = useCallback((name) => {
    const rules = validationRules[name];
    if (!rules) return true;

    const value = values[name];
    for (const rule of rules) {
      const error = typeof rule === 'function' ? rule(value) : rule(value);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
        return false;
      }
    }
    setErrors((prev) => ({ ...prev, [name]: null }));
    return true;
  }, [values, validationRules]);

  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((name) => {
      const rules = validationRules[name];
      const value = values[name];

      for (const rule of rules) {
        const error = typeof rule === 'function' ? rule(value) : rule(value);
        if (error) {
          newErrors[name] = error;
          isValid = false;
          break;
        }
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );
    return isValid;
  }, [values, validationRules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValue,
    validateField,
    validateAll,
    reset,
    setValues,
    setErrors,
  };
}

export default validators;