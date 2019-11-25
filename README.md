## Rails 5 and 6 Form Validation

Read on for a complete solution for integrating Rails server side model
validations with client side browser HTML5 validations

Rails 5 and 6 server side ActiveRecord model validations under Turbolinks 5
are broken and do not automatically render the error messages to the user
without a workaround.

This package contains a [Stimulus](https://github.com/stimulusjs/stimulus)
controller for improved HTML 5 client side form validation error display.

It is useful in any environment and it plays well with the recommended
Rails ActiveRecord model validation error display workaround documented below.

This stimulus controller works with or without Rails, with or without
[Turbolinks](https://github.com/turbolinks/turbolinks) running,
with or without data-remote Ajax form submission enabled, and falls back
gracefully to the default browser HTML 5 form validations when
Javascript is disabled.

- It disables the HTML 5 validation system with the attribute `novalidate`.
  This will still let us use the API, but it will stop showing native
  validation messages.

- It validates each field on blur events, and whole forms when they
  are submitted.

- It prevents invalid forms from being submitted.
  This works with both Rails `data-remote="true"` Ajax form submission and
  regular full page load form submission.

- It marks invalid fields with the class `.invalid`. This allows us to
  integrate smoothly with server side validation errors.

- It shows native error messages by inserting a customizable error element
  with class `.error` after each invalid input field.
  This matches the format for showing server
  side errors so the user sees a consistent feedback display.


## Example

The new form validations look like this, first showing any client side
validation messages until they are fixed, and then any server side
validation messages.

![HTML validation demo](images/form-validation.gif)

Here is the example form using Rails `form_with` that links to the
`form` controller.

```erb
<%= form_with(model: @article, data: { controller: 'form' }) do |form| %>
  <div>
    <%= form.label :title %><br>
    <%= form.text_field :title, required: true %>
  </div>

  <div>
    <%= form.label :text %><br>
    <%= form.text_area :text, required: true %>
  </div>

  <div>
    <%= form.submit %>
  </div>
<% end %>
```


## Configuration Settings

### - `invalid` -

The `invalid` setting specifies the class that gets added to an input, select,
or textarea element containing an invalid value. It defaults to `invalid`
but can be set to any class name.

```html
<input required="required" type="text"
  name="article[title]" id="article_title"
  class="invalid">
```

### - `error` -

The `error` setting specifies the class of an error element that gets added
after an input element containing an invalid value.
It defaults to `error` but can be set to any class name.

``` html
<span class="error"><br>Please fill out this field.</span>
```

### - `template` -

You can specify the error element that gets added after input elements
containing an invalid value. Here is the default error element template.

```html
<span class="{error}"><br>{message}</span>
```

The controller will replace `{error}` with the error class name and
`{message}` with the field validation message(s).

The error element should include the error element class name so that
the error message can be removed when the input is corrected.

### - `debug` -

You can turn on console log debugging messages to see what is happening
during the field by field validation process.
To turn on logging set `debug` to `'true'` or any value except
`['false', 'f', 'off', '0', '']`.


## Per Form Configuration Examples

You can customize the configuration values both globally and per form.

Here is how to set the form configuration values from within Rails.

```erb
<%= form_with(model: @article, data: {
      controller: 'form',
      'form-invalid': 'invalid-input-class-name',
      'form-error': 'error-element-class-name',
      'form-template': '<p class="glowing {error}">Attention! {message}</p>',
      'form-debug': true
    }) do |form| %>
```

Here is a form configured with the default values in HTML to show
configuration outside of Rails.

```html
<form
  data-controller="form"
  data-form-invalid="invalid"
  data-form-error="error"
  data-form-template="<span class=&quot;{error}&quot;><br>{message}</span>"
  data-form-debug="false"
  action="/articles"
  method="post"
>
```


## Client Side Validation Setup

Add [rails-form-validation](https://github.com/jgorman/rails-form-validation)
to package.json and register it with
[Stimulus](https://github.com/stimulusjs/stimulus).

You can set the application global defaults if you like or use the built in
configuration values.

```
yarn add rails-form-validation
```

```js
// Stimulus setup.
import { Application } from 'stimulus'
const application = Application.start()

// Register the form controller.
import Form from 'rails-form-validation'
application.register('form', Form)

// You can optionally set up application global defaults.
Form.config({
  error: 'global-default-error-element-class-name',
  invalid: 'global-default-invalid-input-class-name',
  template: '<span class="{error}"><br>Global default {message}</span>',
  debug: 'turn-on-console-debug-logging-globally',
})
```


## Integration with Rails 5 and 6 Server Side Validations

Server side validations are not properly supported under Rail 5 and 6.
Turbolinks 6 is expected to [address these issues](
  https://github.com/turbolinks/turbolinks-rails/issues/40
).

> I can confirm Turbolinks 6 will handle form submissions in a way
> that makes this unnecessary, among many other goodies

Check out this excellent article by [Jorge Manrubia](
  https://www.jorgemanrubia.com/
)
on [Form validations with HTML5 and modern Rails](
https://www.jorgemanrubia.com/2019/02/16/form-validations-with-html5-and-modern-rails/
)


## Rails Server Side Validation Setup

### 1. Add Jorge's `turbolinks_render` gem to the Gemfile.

```ruby
gem 'turbolinks_render'
```

### 2. Tag the form HTML with the server validation messages.

Add this file to `config/initializers/form_errors.rb` and set
the configuration values to match the client side settings.

```ruby
# Insert model validation error messages after the input elements.
#
# Add this file to config/initializers/form_errors.rb
#
# You can configure these options here.

config = {
  error: 'error',
  invalid: 'invalid',
  template: '<span class="{error}"><br>{message}</span>'
}

ActionView::Base.field_error_proc =
  Proc.new do |html_tag, instance_tag|

    # Find the invalid input element.
    fragment = Nokogiri::HTML.fragment(html_tag)
    field = fragment.at('input,select,textarea')

    if field

      # Get the configuration options.
      error = config[:error]
      invalid = config[:invalid]
      template = config[:template]

      # Add the input element invalid class.
      field['class'] = "#{field['class']} #{invalid}"

      # Create the error message alert element.
      model = instance_tag.object
      field_name = instance_tag.instance_variable_get(:@method_name)
      field_title = field_name.titleize
      field_errors = model.errors[field_name]
      message = field_errors.map { |msg| "#{field_title} #{msg}" }.join(', ')
      alert = template.gsub('{error}', error).gsub('{message}', message)

      # Append the alert to the invalid input element.
      html = "#{fragment.to_s} #{alert}".html_safe

    else

      # Return the element as is.
      html = html_tag

    end

    html.html_safe
  end
```

Thats it! You now have a unified browser and Rails model validation error
display setup.
