document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la date actuelle en heure locale du client
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('createdAt').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Récupérer l'utilisateur connecté
    fetchCurrentUser()
        .then(user => {
            if (user) {
                document.getElementById('createdBy').value = user.username;
            }
        })
        .catch(error => console.error('Erreur lors de la récupération de l\'utilisateur:', error));
    
    // Gérer la soumission du formulaire
    document.getElementById('createTicketForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const formData = {
            caller: document.getElementById('caller').value,
            reason: document.getElementById('reason').value,
            tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()),
            status: document.getElementById('status').value,
            isGLPI: document.getElementById('isGLPI').checked,
            createdAt: document.getElementById('createdAt').value,
            createdBy: document.getElementById('createdBy').value
        };
        
        // Soumission vers la route serveur existante
        fetch('/admin/create-ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (response.redirected) {
                window.location.href = response.url;
                return;
            }
            if (!response.ok) {
                throw new Error('Erreur lors de la création du ticket');
            }
            window.location.href = '/';
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors de la création du ticket: ' + error.message);
        });
    });
}); 