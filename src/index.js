import { Controller } from 'stimulus'

/*
 * HTML5 Client Side Form Validation Stimulus Controller
 * https://github.com/jgorman/stimulus-form-validation.git
 *
 * Example:
 *

<%= form_with(model: @article, data: { controller: 'form' }) do |form| %>
  <div>
    <%= form.label :title %><br>
    <%= form.text_field :title, required: true %>
  </div>

  <div>
    <%= form.submit %>
  </div>
<% end %>

*/

const template = '<span class="{error}"><br>{message}</span>'

export default class extends Controller {
  initialize() {
    this.invalid = this.data.get('invalid') || 'invalid'
    this.error = this.data.get('error') || 'error'
    this.template = this.data.get('template') || template
    const debug_s = (this.data.get('debug') || 'false').toLowerCase()
    this.debug = !['false', 'f', 'off', '0', ''].includes(debug_s)

    this.log('=== initialize', {
      form: this.element,
      invalid: this.invalid,
      error: this.error,
      template: this.template,
      debug: this.debug,
    })
  }

  connect() {
    this.log('=== connect', { form: this.element })
    this.element.setAttribute('novalidate', true)
    this.element.addEventListener('blur', this.onBlur, true)
    this.element.addEventListener('submit', this.onSubmit)
    this.element.addEventListener('ajax:beforeSend', this.onAjax)
  }

  disconnect() {
    this.log('=== disconnect', { form: this.element })
    this.element.removeEventListener('blur', this.onBlur)
    this.element.removeEventListener('submit', this.onSubmit)
    this.element.removeEventListener('ajax:beforeSend', this.onAjax)
  }

  log = (msg, info) => {
    if (!this.debug) return
    if (info) {
      const field = info.field
      if (field) {
        if (field.type === 'hidden') {
          msg += ' hidden'
        }
        if (!field.id && field.name) {
          msg += ' ' + field.name
        }
      }
      console.log(msg, info)
    } else {
      console.log(msg)
    }
  }

  onBlur = event => {
    this.log('^^^ onBlur', { field: event.target })
    this.validateField(event.target)
  }

  // onSubmit gets called first to validate the form.
  onSubmit = event => {
    this.formIsValid = this.validateForm()
    if (this.formIsValid) {
      this.log('^^^ onSubmit Okay', { event })
    } else {
      this.log('^^^ onSubmit Skip', { event })
      event.preventDefault()
      this.firstInvalidField.focus()
    }
  }

  // onAjax gets called second and we disable the ajax for invalid forms.
  onAjax = event => {
    if (this.formIsValid) {
      this.log('^^^ onAjax Okay', { event })
    } else {
      this.log('^^^ onAjax Skip', { event })
      event.preventDefault()
    }
  }

  validateForm = () => {
    this.log('<<< Form', { form: this.element })
    let isValid = true
    this.formFields.forEach(field => {
      if (this.shouldValidateField(field) && !this.validateField(field))
        isValid = false
    })
    this.log(`>>> Form ${isValid ? 'Valid' : 'Invalid!'}`, {
      form: this.element,
    })
    return isValid
  }

  validateField = field => {
    if (!this.shouldValidateField(field)) {
      return true
    }
    const isValid = field.checkValidity()
    field.classList.toggle(this.invalid, !isValid)
    this.refreshErrorForInvalidField(field, isValid)
    if (isValid) {
      this.log('___ Valid', { field })
    }
    return isValid
  }

  shouldValidateField = field => {
    const shouldValidate =
      field.checkValidity &&
      !field.disabled &&
      !['file', 'reset', 'submit', 'button'].includes(field.type)
    if (!shouldValidate) {
      this.log('___ Skip', { field })
    }
    return shouldValidate
  }

  refreshErrorForInvalidField = (field, isValid) => {
    this.removeExistingErrorMessage(field)
    if (!isValid) this.showErrorForInvalidField(field)
  }

  removeExistingErrorMessage = field => {
    const existingErrorMessageElement = field.parentNode.querySelector(
      '.' + this.error
    )
    if (existingErrorMessageElement)
      existingErrorMessageElement.parentNode.removeChild(
        existingErrorMessageElement
      )
  }

  showErrorForInvalidField = field => {
    field.insertAdjacentHTML('afterend', this.buildFieldErrorHtml(field))
  }

  buildFieldErrorHtml = field => {
    let errorHtml = this.template
    errorHtml = errorHtml.replace(/{error}/g, this.error)
    errorHtml = errorHtml.replace(/{message}/g, field.validationMessage)
    this.log('___ Invalid!', { field, errorHtml })
    return errorHtml
  }

  get formFields() {
    return Array.from(this.element.elements)
  }

  get firstInvalidField() {
    return this.formFields.find(field => !field.checkValidity())
  }
}
