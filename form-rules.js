/* Shared form rules: used in the browser and on the server so both check the same things. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FormRules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var SUPPORT = [
    'Educational materials and school supplies',
    'Assistive devices or mobility support',
    'Connecting with healthcare or therapy professionals',
    'Guidance for parents and caregivers',
    'Referral to other support organisations',
    'Other'
  ];
  var FORMS = {
    volunteer: { label: 'Volunteer registration', fields: {
      name: { label: 'Full name', max: 100, req: 1 },
      email: { label: 'Email address', max: 120, req: 1, email: 1 },
      phone: { label: 'Phone number', max: 30, phone: 1 },
      skills: { label: 'Skills you can offer', max: 600, req: 1, multi: 1 },
      availability: { label: 'Availability', max: 300, req: 1 }
    } },
    partnership: { label: 'Partnership enquiry', fields: {
      organisation: { label: 'Organisation name', max: 150, req: 1 },
      contact_name: { label: 'Contact person', max: 100, req: 1 },
      email: { label: 'Email address', max: 120, req: 1, email: 1 },
      phone: { label: 'Phone number', max: 30, phone: 1 },
      proposal: { label: 'Proposed collaboration', max: 1500, req: 1, multi: 1 }
    } },
    family: { label: 'Family support request', needOne: ['email', 'phone'], fields: {
      name: { label: 'Your name', max: 100, req: 1 },
      email: { label: 'Email address', max: 120, email: 1 },
      phone: { label: 'Phone number', max: 30, phone: 1 },
      support_type: { label: 'Type of support needed', req: 1, options: SUPPORT },
      description: { label: 'Description of your request', max: 1000, req: 1, multi: 1 }
    } }
  };
  function clean(v, multi) {
    v = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    if (!multi) v = v.replace(/[\r\n]+/g, ' ');
    return v.trim();
  }
  function validate(type, input) {
    var f = Object.prototype.hasOwnProperty.call(FORMS, type) ? FORMS[type] : null;
    if (!f) return { ok: false, errors: { _form: 'Unknown form.' }, data: {} };
    input = input || {};
    var out = {}, err = {};
    Object.keys(f.fields).forEach(function (k) {
      var r = f.fields[k], v = clean(input[k], r.multi);
      if (!v) { if (r.req) err[k] = r.label + ' is required.'; return; }
      if (r.max && v.length > r.max) { err[k] = r.label + ' must be ' + r.max + ' characters or fewer.'; return; }
      if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { err[k] = 'Enter a valid email address.'; return; }
      if (r.phone && !/^[0-9+()\-\s]{6,30}$/.test(v)) { err[k] = 'Enter a valid phone number.'; return; }
      if (r.options && r.options.indexOf(v) < 0) { err[k] = 'Choose one of the options.'; return; }
      out[k] = v;
    });
    if (f.needOne && !f.needOne.some(function (k) { return out[k]; }) && !f.needOne.some(function (k) { return err[k]; })) {
      err[f.needOne[0]] = 'Please give an email address or a phone number so we can reply.';
    }
    if (input.consent !== true) err.consent = 'Please tick the box to confirm you have read the privacy notice.';
    return { ok: Object.keys(err).length === 0, errors: err, data: out };
  }
  return { FORMS: FORMS, SUPPORT: SUPPORT, validate: validate };
});
