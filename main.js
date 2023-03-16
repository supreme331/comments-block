const store = {
    commentsItems: [],
    isNewFirst: true,
};

class Comment {
    constructor(ownerName, text, date) {
        this.id = Date.now();
        this.ownerName = ownerName;
        this.text = text;
        this.date = date;
        this.likesCount = 0;
        this.liked = false;
    }
}

const addCommentForm = document.forms['add-comment'];
const commentsList = document.getElementById('comments-list');
const commentsCountElem = document.getElementById('comments-count');
const sortCommentsElem = document.getElementById('sort');
const commentsAddBlockElem = document.querySelector('.comments__add-block');
const nameInputElem = document.getElementById('name');
const textareaElem = document.getElementById('text');
const textareaMessageLengthElem = document.getElementById('textarea-message-length');
const textareaResetBtn = document.getElementById('textarea-reset');

// Событие отправки формы
addCommentForm.addEventListener('submit', function (e) {
    e.preventDefault();
    createComment();
    initializeApp();
})

// Слушатель кликов по элементам формы
addCommentForm.addEventListener('click', function (e) {
    // Событие отчистки textarea
    if (e.target.id === 'textarea-reset') {
        addCommentForm.text.value = '';
        textareaMessageLengthElem.textContent = '0';
    }
})

// Слушатель изменения полей ввода
commentsAddBlockElem.addEventListener('input', function (e) {

    // Событие удаления сообщения об ошибке валидации name input
    if (e.target.id === 'name' && e.target.classList.contains('error')) {
        removeValidationMessage(nameInputElem);
    }

    if (e.target.id === 'text') {
        // Изменение значений счетчика введенных символов в textarea
        textareaMessageLengthElem.textContent = e.target.value.length;

        if (e.target.value.length > 1000) {
            textareaMessageLengthElem.nextElementSibling.style.color = 'red'
        }
        if(e.target.value.length < 1000) {
            textareaMessageLengthElem.nextElementSibling.style.color = '#808080'
        }

        // Событие удаления сообщения об ошибке валидации name input
        if (e.target.parentElement.classList.contains('error')) {
            removeValidationMessage(textareaElem.parentElement);
        }
    }
})

// Событие фокусировки на textarea
textareaElem.addEventListener('focus', function () {
    // Отрисовка счетчика количества введенных символов и кнопки отчистки textarea
    textareaMessageLengthElem.parentElement.style.opacity = '1';
    textareaResetBtn.style.opacity = '1';
})

// Событие потери фокусировки на textarea
textareaElem.addEventListener('blur', function () {
    // Скрытие счетчика количества введенных символов и кнопки отчистки textarea
    textareaMessageLengthElem.parentElement.style.opacity = '0';
    textareaResetBtn.style.opacity = '0';
})

// Слушатель списка комментариев
commentsList.addEventListener('click', function (e) {
    // Нажатие кнопки удалить комментарий
    if (e.target.closest('.item-comment__delete')) {
        showModal(e.target);
    }

    // Нажатие кнопки like
    if (e.target.closest('.item-comment__like')) {
        likeToggle(+e.target.closest('.item-comment__like').dataset.commentId);
    }
})

// Слушатель изменения порядка сортировки комментариев
sortCommentsElem.addEventListener('click', () => sortCommentsItems(!store.isNewFirst));

// Инициализация приложения
function initializeApp() {
    loadDataFromLocalStorage();

    commentsList.innerHTML = '';
    commentsCountElem.textContent = composeTitle(store.commentsItems?.length || 0);

    if (!store.commentsItems.length) {
        sortCommentsElem.style.display = 'none';
        const comment = document.createElement('li')
        comment.className = "list-comments__empty-li";
        comment.append(document.createElement('div'));
        commentsList.append(comment);
        return;
    }

    store.commentsItems.forEach(comment => addComment(comment));
    sortCommentsElem.style.display = 'block';

    setSortCommentsElemClass();
}

// Создание объекта комментария в store
function createComment() {
    const ownerName = addCommentForm.name.value;
    let text = addCommentForm.text.value;
    const date = addCommentForm.date.valueAsNumber
        ? addCommentForm.date.valueAsNumber - Math.abs(new Date().getTimezoneOffset() * 60 * 1000)
        : Date.now();

    // Исправление слишком длинных строк(непрерывно написанных "без пробела" символов)
    // P.S. По-хорошему конечно необходимо привязывать максимальную длину строк в зависимости от ширины элемента
    // комментария в DOM, соответственно производить вычисления непосредственно перед добавлением текста в DOM
    // P.P.S Возможно есть более лаконичные методы для решения данной проблемы
    text = fixLongStr(text);

    // Проверка валидации
    const validationResult = validateFields(ownerName, text)

    if (!validationResult.nameInput.isValid || !validationResult.textarea.isValid) {

        if (!validationResult.nameInput.isValid) {
            showValidationMessage(nameInputElem, validationResult.nameInput.errorMessage);
        }
        if (!validationResult.textarea.isValid) {
            showValidationMessage(textareaElem.parentElement, validationResult.textarea.errorMessage);
        }
        return;
    }

    const newComment = new Comment(ownerName, text, date);

    store.commentsItems.push(newComment);
    sortCommentsItems(store.isNewFirst);
    saveDataToLocalStorage();
    resetForm();
}

// Добавление комментария в DOM
function addComment(commentData) {
    const comment = document.createElement('li')
    comment.className = "list-comments__item item-comment";
    const date = dateToString(commentData.date);

    comment.innerHTML = `
                                <div class="item-comment__head">
                                <div class="item-comment__avatar">
                                    <img src="img/avatar.png" alt="avatar">
                                </div>
                                <div class="item-comment__head-content">
                                    <div class="item-comment__head-name">
                                        ${commentData.ownerName}
                                    </div>
                                    <div class="item-comment__head-date">
                                        ${date}
                                    </div>
                                </div>
                            </div>
                            <div class="item-comment__text">
                                ${commentData.text}
                            </div>
                            <div class="item-comment__delete"></div>
                            <div class="item-comment__like">
                            ${commentData.liked
        ? `<div class="item-comment__like-img liked"></div>`
        : `<div class="item-comment__like-img"></div>`}                                
                                <span>${commentData.likesCount}</span>
                            </div>
    `
    const removeElem = comment.querySelector('.item-comment__delete');
    const likeBtn = comment.querySelector('.item-comment__like');
    removeElem.dataset.commentId = commentData.id;
    likeBtn.dataset.commentId = commentData.id;

    commentsList.append(comment);
}

// Удаление объекта комментария из store
function removeComment(commentId) {
    store.commentsItems = store.commentsItems.filter(item => item.id !== commentId);
    saveDataToLocalStorage();
    initializeApp();
}

// Функция вывода модального окна при удалении комментария
function showModal(target) {
    const commentId = +target.dataset.commentId;
    const modalElem = document.createElement('div')
    modalElem.classList.add('overlay')
    modalElem.innerHTML = `        
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Вы уверены, что хотите удалить комментарий?</h3>
          </div>
          <div class="modal-buttons">
            <button data-remove-comment = 'true'>Да</button>
            <button data-remove-comment = 'false'>Нет</button>            
          </div>
        </div>
      `
    modalElem.addEventListener('click', function (e) {
        if (!e.target.dataset.removeComment) return;
        if (e.target.dataset.removeComment === 'true') {
            removeComment(commentId);
        }
        modalElem.remove();
    })

    document.body.prepend(modalElem);
}

// Добавления/удаления лайка для комментария
function likeToggle(commentId) {
    const comment = store.commentsItems.find(item => item.id === commentId);

    if (comment.liked) {
        comment.liked = false;
        comment.likesCount--;
        saveDataToLocalStorage();
        return;
    }
    if (!comment.liked) {
        comment.liked = true;
        comment.likesCount++;
        saveDataToLocalStorage();
    }
}

// Генерация заголовка с общим количеством комментариев
function composeTitle(commentsCount) {
    const commentsCountSplit = commentsCount.toString().split('');

    // 11 - 19
    if (commentsCountSplit[commentsCountSplit.length - 2] === '1') {
        if (+(commentsCountSplit[commentsCountSplit.length - 1]) > 0) {
            return commentsCount + ' комментариев';
        }
    }

    // Последняя единица
    if (commentsCountSplit[commentsCountSplit.length - 1] === '1') {
        return commentsCount + ' комментарий';
    }

    // Последняя цифра от 2 до 4
    if (+(commentsCountSplit[commentsCountSplit.length - 1]) > 1
        && +(commentsCountSplit[commentsCountSplit.length - 1]) < 5) {
        return commentsCount + ' комментария';
    }

    // Последняя цифра больше 5 или 0
    if (+(commentsCountSplit[commentsCountSplit.length - 1]) >= 5
        || commentsCountSplit[commentsCountSplit.length - 1] === '0') {
        return commentsCount === 0 ? 'Список комментариев пуст' : commentsCount + ' комментариев';
    }
}

// Генерация строкового значения даты комментария для DOM
function dateToString(date) {
    const isToday = ((Date.now() - date) < 86400000) && (new Date(Date.now()).getDate() === new Date(date).getDate());
    const isYesterday = (new Date(Date.now()).getDate() - new Date(date).getDate()) === 1;
    const time = new Date(date).toLocaleTimeString().slice(0, 5)

    if (isToday) {
        return time === '00:00' ? 'Сегодня' : `Сегодня, ${time}`;
    } else if (isYesterday) {
        return time === '00:00' ? 'Вчера' : `Вчера, ${time}`;
    } else {
        return time === '00:00'
            ? new Date(date).toLocaleDateString()
            : `${new Date(date).toLocaleDateString()}, ${time}`;
    }
}

// Сохранение store data в локальном хранилище
function saveDataToLocalStorage() {
    localStorage.setItem('commentsItems', JSON.stringify(store.commentsItems));
    localStorage.setItem('isNewFirst', JSON.stringify(store.isNewFirst));
    initializeApp();
}

// Загрузка store data из локального хранилища
function loadDataFromLocalStorage() {
    store.commentsItems = JSON.parse(localStorage.getItem('commentsItems')) || [];
    store.isNewFirst = JSON.parse(localStorage.getItem('isNewFirst')) ?? store.isNewFirst;
}

// Вспомогательная функция для переключения "Сначала новые"/"Сначала старые"
function setSortCommentsElemClass() {
    if (store.isNewFirst) {
        sortCommentsElem.classList.add('new');
        sortCommentsElem.classList.remove('old');
    }
    if (!store.isNewFirst) {
        sortCommentsElem.classList.add('old');
        sortCommentsElem.classList.remove('new');
    }
}

// Изменение порядка сортировки комментариев
function sortCommentsItems(isNewFirst) {
    store.isNewFirst = isNewFirst;

    if (store.isNewFirst) {
        store.commentsItems.sort((a, b) => b.date - a.date);
    }
    if (!store.isNewFirst) {
        store.commentsItems.sort((a, b) => a.date - b.date);
    }

    setSortCommentsElemClass();
    saveDataToLocalStorage();
}

// Простейшая валидация
function validateFields(ownerName, text) {
    return {
        nameInput: {
            isValid: ownerName.length >= 2 && ownerName.length < 40,
            errorMessage: ownerName.length < 2 ? 'Имя слишком короткое'
                : ownerName.length > 40 ? 'Имя не может быть больше 40 символов' : ''
        },
        textarea: {
            isValid: text.length > 2 && text.length < 1000,
            errorMessage: text.length < 2 ? 'Комментарий слишком короткий'
                : text.length > 1000 ? 'Максимальная длина комментария 1000 символов' : ''
        }
    };
}

// Исправление слишком длинных строк
function fixLongStr(str) {
    let split = str.split(' ');

    const changed = split.map(substr => {
        const splitSubstr = substr.split('\n');

        return splitSubstr.map(word => {
            if (word.length > 20) {
                const splitWord = word.split('')

                let char;
                let i = 0;

                do {
                    if (i % 20 === 0 && i > 0) {
                        splitWord.splice(i, 0, '\n');
                    }

                    char = splitWord[++i];

                } while (char)
                return splitWord.join('');
            }
            return word;
        }).join('\n');
    })
    return changed.join(' ').replaceAll('\n', '</br>');
}

// Функция вывода сообщения об ошибке валидации
function showValidationMessage(element, messageText) {
    if (element.classList.contains('error')) return;

    const messageElem = document.createElement('div');
    messageElem.textContent = messageText;
    messageElem.className = 'error-message';
    element.classList.add('error');
    element.after(messageElem);
}

// Функция удаления сообщения об ошибке валидации
function removeValidationMessage(element) {
    element.nextElementSibling?.remove();
    element.classList.remove('error');
}

// Сброс данных формы
function resetForm() {
    addCommentForm.reset();
    textareaMessageLengthElem.textContent = '0';
}

initializeApp();
