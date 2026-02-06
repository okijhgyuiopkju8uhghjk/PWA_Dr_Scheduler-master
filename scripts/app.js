document.addEventListener('DOMContentLoaded', () => {
  const doctorsContainer = document.querySelector('.doctors-container');
  const boxesContainer = document.querySelector('.boxes-container');
  const createBtn = document.getElementById('create');
  const copyBtn = document.getElementById('copy');
  const output = document.getElementById('output');
  const onCallModal = document.getElementById('on-call-modal');
  const modalOptions = document.getElementById('modal-options');
  const scheduleInput = document.getElementById('schedule-input');

  const doctorMapping = {
    'D': 'Dr Deepak',
    'N': 'Dr Nikhilesh',
    'S': 'Dr Srinivas',
    'R': 'Dr Rajesh',
    '-': ' - '
  };

  // Add the original classes for styling
  doctorsContainer.classList.add('doctors');
  boxesContainer.classList.add('boxes');

  let pendingOnCall = null;

  function updateState() {
    const selectedDay = document.querySelector('input[name="day"]:checked').value;
    const doctors = document.querySelectorAll('.doctor');
    const container = document.querySelector('.container');

    if (selectedDay === 'not-selected') {

      container.style.backgroundColor = '#F2A799';
      doctors.forEach(doctor => doctor.draggable = false);
    } else if (selectedDay === 'today icu/ot doctors') {

      container.style.backgroundColor = '#C2C2C2';
      doctors.forEach(doctor => doctor.draggable = true);
    } else if (selectedDay === 'tomorrow icu/ot doctors') {

      container.style.backgroundColor = 'skyblue';
      doctors.forEach(doctor => doctor.draggable = true);
    }
  }

  document.querySelectorAll('input[name="day"]').forEach(radio => {
    radio.addEventListener('change', updateState);
  });

  updateState(); // Set initial state

  function showOnCallModal(doctorName, shiftBox) {
    pendingOnCall = { doctorName, shiftBox };
    onCallModal.style.display = 'block';
  }

  function hideOnCallModal() {
    pendingOnCall = null;
    onCallModal.style.display = 'none';
  }

  // Helper functions for Touch and Drop Logic
  let dragHelper = null;

  function createDragHelper(text, color, textColor) {
    const helper = document.createElement('div');
    helper.textContent = text;
    helper.style.position = 'fixed';
    helper.style.backgroundColor = color;
    helper.style.color = textColor;
    helper.style.padding = '10px';
    helper.style.borderRadius = '5px';
    helper.style.pointerEvents = 'none';
    helper.style.zIndex = '1000';
    helper.style.opacity = '0.9';
    helper.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(helper);
    return helper;
  }

  function moveDragHelper(x, y) {
    if (dragHelper) {
      dragHelper.style.left = x + 'px';
      dragHelper.style.top = y + 'px';
    }
  }

  function handleDropAction(shiftBox, doctorName) {
    const shiftId = shiftBox.dataset.shift;
    const shiftName = shiftBox.dataset.shiftName;

    if (shiftId === 'oncall') {
      showOnCallModal(doctorName, shiftBox);
    } else if (shiftId === 'off') {
      if (shiftBox.dataset.doctors) {
        shiftBox.dataset.doctors += `, ${doctorName}`;
      } else {
        shiftBox.dataset.doctors = doctorName;
      }
      shiftBox.textContent = `Duty Off: ${shiftBox.dataset.doctors}`;
    } else {
      shiftBox.textContent = `${shiftName}: ${doctorName}`;
      shiftBox.dataset.doctor = doctorName;
    }
    shiftBox.classList.remove('dragover');
  }

  modalOptions.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON' && pendingOnCall) {
      const time = e.target.dataset.time;
      const { doctorName, shiftBox } = pendingOnCall;

      shiftBox.textContent = `Anesthesiologist On Call: ${doctorName} (${time})`;
      shiftBox.dataset.doctor = doctorName;
      shiftBox.dataset.time = time;

      hideOnCallModal();
    }
  });

  // Create doctor buttons
  doctors.forEach(doc => {
    const docButton = document.createElement('button');
    docButton.classList.add('doctor');
    docButton.draggable = true;
    docButton.textContent = doc.name;
    docButton.style.backgroundColor = doc.color;
    docButton.style.color = doc.textColor;
    docButton.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', doc.name);
    });

    // Touch events for mobile
    docButton.addEventListener('touchstart', e => {
      if (docButton.draggable === false) return;
      e.preventDefault();
      const touch = e.touches[0];
      dragHelper = createDragHelper(doc.name, doc.color, doc.textColor);
      moveDragHelper(touch.clientX, touch.clientY);
    }, { passive: false });

    docButton.addEventListener('touchmove', e => {
      if (!dragHelper) return;
      e.preventDefault();
      const touch = e.touches[0];
      moveDragHelper(touch.clientX, touch.clientY);
    }, { passive: false });

    docButton.addEventListener('touchend', e => {
      if (!dragHelper) return;
      const touch = e.changedTouches[0];
      
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const shiftBox = target ? target.closest('.box') : null;

      if (shiftBox) {
        handleDropAction(shiftBox, doc.name);
      }

      if (dragHelper) {
        dragHelper.remove();
        dragHelper = null;
      }
    });

    doctorsContainer.appendChild(docButton);
  });

  // Create shift boxes
  shifts.forEach(shift => {
    const shiftBox = document.createElement('div');
    shiftBox.classList.add('box');
    shiftBox.dataset.shift = shift.id;
    shiftBox.dataset.shiftName = shift.name;
    shiftBox.textContent = shift.name;
    shiftBox.addEventListener('dragover', e => {
      e.preventDefault();
      shiftBox.classList.add('dragover');
    });

    shiftBox.addEventListener('dragleave', () => {
      shiftBox.classList.remove('dragover');
    });

    shiftBox.addEventListener('drop', e => {
      e.preventDefault();
      const name = e.dataTransfer.getData('text/plain');
      handleDropAction(shiftBox, name);
    });
    boxesContainer.appendChild(shiftBox);
  });

  scheduleInput.addEventListener('input', e => {
    const value = e.target.value.toUpperCase();
    const morningBox = document.querySelector('[data-shift="morning"]');
    const afternoonBox = document.querySelector('[data-shift="afternoon"]');
    const nightBox = document.querySelector('[data-shift="night"]');
    const onCallBox = document.querySelector('[data-shift="oncall"]');
    const offBox = document.querySelector('[data-shift="off"]');

    // Reset boxes
    morningBox.textContent = 'Morning Duty';
    morningBox.dataset.doctor = '';
    afternoonBox.textContent = 'Afternoon Duty';
    afternoonBox.dataset.doctor = '';
    nightBox.textContent = 'Night Duty';
    nightBox.dataset.doctor = '';
    onCallBox.textContent = 'Anesthesiologist On Call';
    onCallBox.dataset.doctor = '';
    onCallBox.dataset.time = '';
    offBox.textContent = 'Duty Off';
    offBox.dataset.doctors = '';


    if (value.length === 4) {
      const [morningChar, afternoonChar, nightChar, offChar] = value.split('');
      
      const morningDoctor = doctorMapping[morningChar];
      const afternoonDoctor = doctorMapping[afternoonChar];
      const nightDoctor = doctorMapping[nightChar];
      const offDoctor = doctorMapping[offChar];

      if (morningDoctor) {
        morningBox.textContent = `Morning Duty: ${morningDoctor}`;
        morningBox.dataset.doctor = morningDoctor;
      }
      if (afternoonDoctor) {
        afternoonBox.textContent = `Afternoon Duty: ${afternoonDoctor}`;
        afternoonBox.dataset.doctor = afternoonDoctor;
      }
      if (nightDoctor) {
        nightBox.textContent = `Night Duty: ${nightDoctor}`;
        nightBox.dataset.doctor = nightDoctor;
      }
      if (offDoctor) {
        offBox.textContent = `Duty Off: ${offDoctor}`;
        offBox.dataset.doctors = offDoctor;
      }

    } else if (value.length === 5) {
      const [morningChar, afternoonChar, nightChar, onCallChar, offChar] = value.split('');

      const morningDoctor = doctorMapping[morningChar];
      const afternoonDoctor = doctorMapping[afternoonChar];
      const nightDoctor = doctorMapping[nightChar];
      const onCallDoctor = doctorMapping[onCallChar];
      const offDoctor = doctorMapping[offChar];

      if (morningDoctor) {
        morningBox.textContent = `Morning Duty: ${morningDoctor}`;
        morningBox.dataset.doctor = morningDoctor;
      }
      if (afternoonDoctor) {
        afternoonBox.textContent = `Afternoon Duty: ${afternoonDoctor}`;
        afternoonBox.dataset.doctor = afternoonDoctor;
      }
      if (nightDoctor) {
        nightBox.textContent = `Night Duty: ${nightDoctor}`;
        nightBox.dataset.doctor = nightDoctor;
      }
      if (onCallDoctor && onCallDoctor !== ' - ') {
        showOnCallModal(onCallDoctor, onCallBox);
      }
      if (offDoctor) {
        offBox.textContent = `Duty Off: ${offDoctor}`;
        offBox.dataset.doctors = offDoctor;
      }
    }
  });

  createBtn.addEventListener('click', () => {
    const selectedDay = document.querySelector('input[name="day"]:checked').value;

    if (selectedDay === 'not-selected') {
      alert('Please select a day to create the schedule.');
      return;
    }

    const today = new Date();
    const targetDate = selectedDay.includes('today') ? today : new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toLocaleDateString('en-IN');

    const confirmationMessage = `Are you sure about the following?\nDay: ${selectedDay.includes('today') ? 'Today' : 'Tomorrow'}\nDate: ${dateStr}`;
    if (!confirm(confirmationMessage)) {
      return;
    }

    let text = `${selectedDay.toUpperCase()}\nDate: ${dateStr}\n`;

    const morning = document.querySelector('[data-shift="morning"]').dataset.doctor;
    const afternoon = document.querySelector('[data-shift="afternoon"]').dataset.doctor;
    const night = document.querySelector('[data-shift="night"]').dataset.doctor;
    const onCallBox = document.querySelector('[data-shift="oncall"]');
    const onCallDoctor = onCallBox.dataset.doctor;
    const onCallTime = onCallBox.dataset.time;
    const off = document.querySelector('[data-shift="off"]').dataset.doctors;
    const hrs24 = document.querySelector('[data-shift="24hrs"]').dataset.doctor;
    const leave = document.querySelector('[data-shift="leave"]').dataset.doctor;

    if (morning) text += `*8 am to 4 pm:* ${morning}\n`;
    if (afternoon) text += `*12 noon to 8 pm:* ${afternoon}\n`;
    if (night) text += `*5 pm to 9 am (night duty):* ${night}\n`;
    if (hrs24) text += `*24 hrs Duty(9 am to 9 am):* ${hrs24}\n`;
    if (onCallDoctor) text += `*Anesthetist On Call- ${onCallTime} :* ${onCallDoctor}\n`;
    if (off) text += `*Duty off:* ${off}\n`;
    if (leave) text += `*Leave:* ${leave}\n`;


    output.textContent = text.trim();
  });

  copyBtn.addEventListener('click', () => {
    if (output.textContent.trim() !== '') {
      navigator.clipboard.writeText(output.textContent).then(() => {
        alert('Schedule copied to clipboard!');
      });
    } else {
      alert('No schedule to copy!');
    }
  });

  const editBtn = document.getElementById('edit');

  editBtn.addEventListener('click', () => {
    if (output.contentEditable === 'true') {
      output.contentEditable = 'false';
      editBtn.textContent = 'Edit';
      output.style.border = '1px solid #e5e7eb'; // Revert border
    } else {
      output.contentEditable = 'true';
      editBtn.textContent = 'Save';
      output.focus();
      output.style.border = '2px dashed #2563eb'; // Highlight editable area
    }
  });
});