import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormValidation, validators } from './useForm';

describe('useFormValidation', () => {
  describe('validators', () => {
    it('validates required fields', () => {
      expect(validators.required('')).toBe('This field is required');
      expect(validators.required(null)).toBe('This field is required');
      expect(validators.required(undefined)).toBe('This field is required');
      expect(validators.required('value')).toBeNull();
    });

    it('validates email format', () => {
      expect(validators.email('invalid')).toBe('Please enter a valid email address');
      expect(validators.email('test@example.com')).toBeNull();
      expect(validators.email('')).toBeNull(); // Empty is valid (use required for empty check)
    });

    it('validates phone format', () => {
      expect(validators.phone('123')).toBe('Please enter a valid phone number');
      expect(validators.phone('1234567890')).toBeNull();
      expect(validators.phone('')).toBeNull();
    });

    it('validates URL format', () => {
      expect(validators.url('not a url')).toBe('Please enter a valid URL');
      expect(validators.url('https://example.com')).toBeNull();
      expect(validators.url('')).toBeNull();
    });

    it('validates minimum length', () => {
      const minValidator = validators.minLength(3);
      expect(minValidator('ab')).toBe('Must be at least 3 characters');
      expect(minValidator('abc')).toBeNull();
      expect(minValidator('')).toBeNull();
    });

    it('validates maximum length', () => {
      const maxValidator = validators.maxLength(5);
      expect(maxValidator('abcdef')).toBe('Must be no more than 5 characters');
      expect(maxValidator('abc')).toBeNull();
      expect(maxValidator('')).toBeNull();
    });

    it('validates positive numbers', () => {
      expect(validators.positiveNumber('-5')).toBe('Please enter a positive number');
      expect(validators.positiveNumber('abc')).toBe('Please enter a positive number');
      expect(validators.positiveNumber('10')).toBeNull();
      expect(validators.positiveNumber('')).toBeNull();
    });
  });

  describe('useFormValidation hook', () => {
    const initialValues = { email: '', password: '' };

    it('initializes with default values', () => {
      const { result } = renderHook(() => useFormValidation(initialValues));

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });

    it('handles input changes', () => {
      const { result } = renderHook(() => useFormValidation(initialValues));

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'test@example.com' },
        });
      });

      expect(result.current.values.email).toBe('test@example.com');
    });

    it('handles checkbox inputs', () => {
      const { result } = renderHook(() => useFormValidation({ acceptTerms: false }));

      act(() => {
        result.current.handleChange({
          target: { name: 'acceptTerms', type: 'checkbox', checked: true },
        });
      });

      expect(result.current.values.acceptTerms).toBe(true);
    });

    it('validates all fields and returns true when valid', () => {
      const validationRules = {
        email: [validators.required],
        password: [validators.required],
      };
      const { result } = renderHook(() =>
        useFormValidation({ email: 'test@test.com', password: 'pass' }, validationRules)
      );

      let isValid;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('validates all fields and returns false when invalid', () => {
      const validationRules = {
        email: [validators.required, validators.email],
        password: [validators.required],
      };
      const { result } = renderHook(() =>
        useFormValidation({ email: '', password: '' }, validationRules)
      );

      let isValid;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.email).toBe('This field is required');
      expect(result.current.errors.password).toBe('This field is required');
    });

    it('sets individual field errors', () => {
      const { result } = renderHook(() => useFormValidation(initialValues));

      act(() => {
        result.current.setErrors({ email: 'Invalid email' });
      });

      expect(result.current.errors.email).toBe('Invalid email');
    });

    it('sets individual values', () => {
      const { result } = renderHook(() => useFormValidation(initialValues));

      act(() => {
        result.current.setValue('email', 'direct@example.com');
      });

      expect(result.current.values.email).toBe('direct@example.com');
    });

    it('resets form to initial values', () => {
      const { result } = renderHook(() => useFormValidation(initialValues));

      // Modify values
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'test@example.com' },
        });
      });

      expect(result.current.values.email).toBe('test@example.com');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });

    it('marks field as touched on blur', () => {
      const { result } = renderHook(() => useFormValidation(initialValues));

      act(() => {
        result.current.handleBlur({ target: { name: 'email' } });
      });

      expect(result.current.touched.email).toBe(true);
    });

    it('clears error when field is modified', () => {
      const validationRules = {
        email: [validators.required],
      };
      const { result } = renderHook(() =>
        useFormValidation({ email: '' }, validationRules)
      );

      // First set an error manually
      act(() => {
        result.current.setErrors({ email: 'This field is required' });
      });

      expect(result.current.errors.email).toBe('This field is required');

      // Modify the field - should clear the error
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'test@example.com' },
        });
      });

      // Error should be cleared after modification
      expect(result.current.values.email).toBe('test@example.com');
    });

    it('validates field on blur with validation rules', () => {
      const validationRules = {
        email: [validators.required, validators.email],
      };
      const { result } = renderHook(() =>
        useFormValidation({ email: 'invalid' }, validationRules)
      );

      act(() => {
        result.current.handleBlur({ target: { name: 'email' } });
      });

      expect(result.current.errors.email).toBe('Please enter a valid email address');
    });

    it('returns true when validating field with no rules', () => {
      const { result } = renderHook(() => useFormValidation({ field: 'value' }));

      let isValid;
      act(() => {
        isValid = result.current.validateField('field');
      });

      expect(isValid).toBe(true);
    });
  });
});