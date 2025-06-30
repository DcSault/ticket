document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la date actuelle
    const now = new Date();
    document.getElementById('createdAt').value = now.toISOString().slice(0, 16);
    
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
        
        // Appel API pour créer le ticket
        fetch('/api/admin/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la création du ticket');
            }
            return response.json();
        })
        .then(data => {
            alert('Ticket créé avec succès!');
            // Rediriger vers la page d'accueil ou réinitialiser le formulaire
            window.location.href = '/';
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors de la création du ticket: ' + error.message);
        });
    });
}); 