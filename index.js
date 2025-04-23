// Esperar a que el DOM se cargue completamente
document.addEventListener('DOMContentLoaded', function () {
    // Referencias a elementos del DOM
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const pendingColumn = document.getElementById('pendingTasks');
    const inProgressColumn = document.getElementById('inProgressTasks');
    const completedColumn = document.getElementById('completedTasks');
    const pendingCount = document.getElementById('pendingCount');
    const inProgressCount = document.getElementById('inProgressCount');
    const completedCount = document.getElementById('completedCount');

    // Array para almacenar todas las tareas (para persistencia local)
    let tasks = [];

    // Comprobar si hay tareas guardadas en localStorage y cargarlas si existen
    if (localStorage.getItem('tasks')) {
        tasks = JSON.parse(localStorage.getItem('tasks'));
        renderTasks();
    }

    // Event listener para el formulario de añadir tareas
    taskForm.addEventListener('submit', function (e) {
        e.preventDefault(); // Prevenir el envío del formulario

        const taskText = taskInput.value.trim();
        if (taskText) {
            // Crear nueva tarea con ID único y estado "pendiente" por defecto
            const newTask = {
                id: Date.now().toString(), // Timestamp como ID único
                text: taskText,
                status: 'pending',
                createdAt: new Date().toISOString() // Fecha de creación
            };

            // Añadir la tarea al array
            tasks.push(newTask);

            // Guardar en localStorage
            saveTasks();

            // Renderizar las tareas
            renderTasks();

            // Limpiar el input
            taskInput.value = '';

            // Mostrar notificación
            showNotification('Tarea añadida correctamente', 'success');
        }
    });

    // Función para mostrar notificaciones temporales
    function showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '1050';
        notification.style.maxWidth = '300px';
        notification.innerHTML = `
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;

        // Añadir al body
        document.body.appendChild(notification);

        // Eliminar automáticamente después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 150);
        }, 3000);
    }

    // Función para guardar tareas en localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Función para renderizar todas las tareas en sus respectivas columnas
    function renderTasks() {
        // Limpiar todas las columnas
        pendingColumn.innerHTML = `
                    <h3 class="column-title">
                        <i class="fas fa-clipboard-list me-2 text-warning"></i>
                        Pendientes <span class="badge bg-warning" id="pendingCount">0</span>
                    </h3>
                `;
        inProgressColumn.innerHTML = `
                    <h3 class="column-title">
                        <i class="fas fa-spinner me-2 text-primary"></i>
                        En Proceso <span class="badge bg-primary" id="inProgressCount">0</span>
                    </h3>
                `;
        completedColumn.innerHTML = `
                    <h3 class="column-title">
                        <i class="fas fa-check-circle me-2 text-success"></i>
                        Completadas <span class="badge bg-success" id="completedCount">0</span>
                    </h3>
                `;

        // Contador para cada estado
        let pendingCounter = 0;
        let inProgressCounter = 0;
        let completedCounter = 0;

        // Iterar sobre todas las tareas y añadirlas a sus columnas correspondientes
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);

            // Colocar la tarea en la columna correspondiente según su estado
            if (task.status === 'pending') {
                pendingColumn.appendChild(taskElement);
                pendingCounter++;
            } else if (task.status === 'in-progress') {
                inProgressColumn.appendChild(taskElement);
                inProgressCounter++;
            } else if (task.status === 'completed') {
                completedColumn.appendChild(taskElement);
                completedCounter++;
            }
        });

        // Actualizar los contadores
        document.getElementById('pendingCount').textContent = pendingCounter;
        document.getElementById('inProgressCount').textContent = inProgressCounter;
        document.getElementById('completedCount').textContent = completedCounter;

        // Configurar eventos de drag and drop para las nuevas tareas
        setupDragAndDrop();
    }

    // Función para crear un elemento HTML para una tarea
    function createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-item ${task.status}`;
        taskDiv.setAttribute('draggable', 'true');
        taskDiv.setAttribute('data-id', task.id);

        // Formatear fecha para mostrar
        const createdDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Fecha desconocida';

        // Contenido de la tarea
        taskDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="task-text">${task.text}</span>
                            <div class="small text-muted mt-1">Creada: ${createdDate}</div>
                        </div>
                        <div>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenu-${task.id}" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenu-${task.id}">
                                    <li><a class="dropdown-item change-status" href="#" data-status="pending"><i class="fas fa-clipboard-list text-warning me-2"></i>Pendiente</a></li>
                                    <li><a class="dropdown-item change-status" href="#" data-status="in-progress"><i class="fas fa-spinner text-primary me-2"></i>En Proceso</a></li>
                                    <li><a class="dropdown-item change-status" href="#" data-status="completed"><i class="fas fa-check-circle text-success me-2"></i>Completada</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item delete-task" href="#"><i class="fas fa-trash-alt text-danger me-2"></i>Eliminar</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `;

        // Agregar event listeners para cambiar estado y eliminar
        const changeStatusLinks = taskDiv.querySelectorAll('.change-status');
        changeStatusLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const newStatus = this.getAttribute('data-status');
                changeTaskStatus(task.id, newStatus);
            });
        });

        const deleteLink = taskDiv.querySelector('.delete-task');
        deleteLink.addEventListener('click', function (e) {
            e.preventDefault();
            deleteTask(task.id);
        });

        return taskDiv;
    }

    // Función para cambiar el estado de una tarea
    function changeTaskStatus(taskId, newStatus) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            // Guardar el estado anterior para la notificación
            const oldStatus = tasks[taskIndex].status;

            // Actualizar el estado
            tasks[taskIndex].status = newStatus;
            saveTasks();
            renderTasks();

            // Mostrar notificación apropiada
            let message = 'Estado de tarea actualizado';
            if (oldStatus !== newStatus) {
                if (newStatus === 'completed') {
                    message = '¡Tarea completada! 🎉';
                } else if (newStatus === 'in-progress') {
                    message = 'Tarea movida a En Proceso';
                } else if (newStatus === 'pending') {
                    message = 'Tarea movida a Pendientes';
                }
            }
            showNotification(message, 'info');
        }
    }

    // Función para eliminar una tarea
    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        showNotification('Tarea eliminada', 'danger');
    }

    // Configuración de funcionalidad de arrastrar y soltar (drag and drop)
    function setupDragAndDrop() {
        const taskItems = document.querySelectorAll('.task-item');
        const taskColumns = document.querySelectorAll('.task-column');

        // Configurar eventos para los elementos arrastrables
        taskItems.forEach(item => {
            // Cuando comienza el arrastre
            item.addEventListener('dragstart', function () {
                this.classList.add('dragging');
            });

            // Cuando termina el arrastre
            item.addEventListener('dragend', function () {
                this.classList.remove('dragging');
                // Eliminar la clase drag-over de todas las columnas
                taskColumns.forEach(column => {
                    column.classList.remove('drag-over');
                });
            });
        });

        // Configurar eventos para las columnas (zonas de destino)
        taskColumns.forEach(column => {
            // Cuando un elemento arrastrable entra en la zona
            column.addEventListener('dragover', function (e) {
                e.preventDefault(); // Permitir el drop
                this.classList.add('drag-over');
            });

            // Cuando un elemento arrastrable sale de la zona
            column.addEventListener('dragleave', function () {
                this.classList.remove('drag-over');
            });

            // Cuando se suelta un elemento en la zona
            column.addEventListener('drop', function (e) {
                e.preventDefault();
                this.classList.remove('drag-over');

                // Obtener el elemento que se está arrastrando
                const draggingElement = document.querySelector('.dragging');
                if (draggingElement) {
                    const taskId = draggingElement.getAttribute('data-id');
                    const newStatus = this.getAttribute('data-status');

                    // Cambiar el estado de la tarea
                    changeTaskStatus(taskId, newStatus);
                }
            });
        });
    }

    // Configurar inicialmente el drag and drop
    setupDragAndDrop();
});