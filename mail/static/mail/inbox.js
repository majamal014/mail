document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Make POST request to send email
  document.querySelector('#compose-form').onsubmit = function() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        load_mailbox('sent');
        console.log(result);
    });
    
    return false;
  }

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      console.log(email);
      const div = document.createElement('div');
      div.className = 'email'
      div.innerHTML = `<p><strong>${email.sender}</strong></p><p>${email.subject}</p><p>${email.timestamp}</p>`;
      div.addEventListener('click', () => {
        // If email is clicked
        console.log('clicked');
        fetch(`/emails/${email.id}`)
        .then(response => response.json())
        .then(data => {
          document.querySelector('#emails-view').style.display = 'none';
          document.querySelector('#compose-view').style.display = 'none';
          document.querySelector('#view-email').style.display = 'block';
          document.querySelector('#view-email').innerHTML = 
          `
          <div id="email-div">
          <strong>From:</strong> ${data.sender}<br>
          <strong>To:</strong> ${data.recipients.join(', ')}<br>
          <strong>Subject:</strong> ${data.subject}<br>
          <strong>Timestamp:</strong> ${data.timestamp}<br>
          <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
          </div>
          <hr>
          <p>${data.body}</p>
          `;
          
          // Archive buttons
          if (mailbox !== 'sent') {
            button = document.createElement('button');
            button.classList.add("btn");
            button.classList.add("btn-sm");
            button.classList.add("btn-outline-primary");

            button.onclick = () => {
              fetch(`/emails/${data.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                  archived: !data.archived
                })
              })
              .then(() => load_mailbox('inbox'));
            };

            if (data.archived) {
              button.innerHTML = 'Unarchive';
            } else {
              button.innerHTML = 'Archive';
            }
            document.querySelector('#email-div').append(button);
          }
          // add reply functionality
          document.querySelector('#reply').onclick = () => {
            compose_email();
            document.querySelector('#compose-recipients').value = data.sender;
            document.querySelector('#compose-body').value = `\nOn ${data.timestamp} ${data.sender} wrote:\n${data.body}`;

            if (data.subject.startsWith('Re:')) {
              document.querySelector('#compose-subject').value = data.subject;
            } else {
              document.querySelector('#compose-subject').value = `Re: ${data.subject}`;
            }
          };

          // mark email as read
          fetch(`/emails/${data.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              read: true
            })
          });

        });
      });
      if (email.read) {
        div.style.backgroundColor = '#C8C8C8';
      } else {
        div.style.backgroundColor = 'white';
      }
      document.querySelector('#emails-view').append(div);
    });
  });
}