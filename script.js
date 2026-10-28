import * as L from './node_modules/leaflet/dist/leaflet-src.esm.js';

const courses = ["Mathematics", "Physics", "English", "Computer Science", "Dancing", "Chess", "Biology", "Chemistry", "Law", "Art", "Medicine", "Statistics"];


function generateRandomCourse() {
    return courses[Math.floor(Math.random() * courses.length)];
}

function fillFields(user) {
    return {
      ...user,
      id: user.id ?? new Date().getTime(),
      favorite: typeof user.favorite === "boolean" ? user.favorite : false,
      course: courses.find(c => c.toLowerCase() === user.course?.toLowerCase()) ?? generateRandomCourse(),
      bg_color: user.bg_color ?? `#fff`,
      note: user.note ?? "",
    };
}

function normalizeUsers(users) {
    const normalized = users.map(user => fillFields({
        gender: user.gender,
        title: user.name.title,
        full_name: `${user.name.first} ${user.name.last}`,
        city: user.location.city,
        state: user.location.state,
        country: user.location.country,
        postcode: user.location.postcode,
        coordinates: user.location.coordinates,
        timezone: user.location.timezone,
        email: user.email,
        b_date: user.dob.date,
        age: user.dob.age || (new Date().getFullYear() - new Date(user.dob.date).getFullYear()),
        phone: user.phone,
        picture_large: user.picture.large,
        picture_thumbnail: user.picture.thumbnail,
        id: user.login.uuid,
    }));
  
    const unique = new Map();
    for (const user of [...normalized]) {
        const key = user.full_name.trim().toLowerCase();
        if (!unique.has(key)) unique.set(key, user);
    }
    return [...unique.values()];
}

const dashed3 = /^\d{3}-\d{3}-\d{4}$/;      
const parens = /^\(\d{3}\)-\d{3}-\d{4}$/;

const phoneFormats = {
  Australia: /^\d{2}-\d{4}-\d{4}$/,
  Canada: dashed3,
  Denmark: /^\d{8}$/,
  Finland: /^\d{2}-\d{3}-\d{3}$/,
  France: /^\d{2}(-\d{2}){4}$/,
  Germany: /^\d{4}-\d{7}$/,
  Iran: /^\d{3}-\d{8}$/,
  Ireland: dashed3,
  Netherlands: parens,
  "New Zealand": parens,
  Norway: /^\d{8}$/,
  Spain: /^\d{3}-\d{3}-\d{3}$/,
  Switzerland: /^\d{3} \d{3} \d{2} \d{2}$/,
  Turkey: parens,
  "United States": parens,
};

function isCapitalized(value) {
  return /^\p{Lu}/u.test(value);
}

function isValidString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isValidPhone(phone, country) {
  if (typeof phone !== "string") return false;
  const format = phoneFormats[country];
  return format ? format.test(phone) : false;
}

function validateUser(user) {
    const errors = [];
    if (!isValidString(user.full_name)) {
        errors.push("Full name is required and must be a non-empty string");
    } else {
        const nameParts = user.full_name.trim().split(/\s+/);
        if (nameParts.length < 2) {
            errors.push("Full name must contain first name and a last name");
        }
        const isProperlyCapitalized = nameParts.every(part => isCapitalized(part));
        if (!isProperlyCapitalized) {
            errors.push("Full name must be properly capitalized.");
        }
    }

    if (!isValidString(user.gender) || !isCapitalized(user.gender)) {
        errors.push("Gender is required and must be either male or female and must be properly capitalized.");
    }
    if (!isValidString(user.state) || !isCapitalized(user.state)) {
        errors.push("State is required and must be properly capitalized.");
    }
    if (!isValidString(user.city) || !isCapitalized(user.city)) {
        errors.push("City is required and must be properly capitalized.");
    }
    if (!isValidString(user.country) || !isCapitalized(user.country)) {
        errors.push("Country is required and must be properly capitalized.");
    }

    if (typeof user.note === "string" && user.note.trim() !== "" && !isCapitalized(user.note)) {
        errors.push("Note must be properly capitalized if provided.");
    }

    if (!Number.isFinite(user.age) || user.age < 0) {
        errors.push("Age is required and must be a non-negative number.");
    }

    const phone = typeof user.phone === "string" ? user.phone : "";

    if (Object.hasOwn(phoneFormats, user.country)) {
      if (!isValidPhone(phone, user.country)) {
        errors.push(`Phone number must match the format for ${user.country}.`);
      }
    } else if (!/^\+?\d{7,15}$/.test(phone.replace(/[\s()-]/g, ""))) {
      errors.push("Phone number must contain 7-15 digits (spaces, dashes and parentheses are allowed).");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        errors.push("A valid email address is required.");
    }
    
    return errors;
}


function filterUsers(users, {country, gender, favorite, minAge, maxAge, photo} = {}) {
  return users.filter(u => {
    if ((country != null && country !== "") && u.country?.toLowerCase() !== country.toLowerCase()) return false;
    if (minAge != null && !(u.age >= minAge)) return false;
    if (maxAge != null && !(u.age <= maxAge)) return false;
    if (gender != null && u.gender?.toLowerCase() !== gender.toLowerCase()) return false;
    if (photo && !u.picture_large) return false;
    if (favorite && u.favorite !== favorite) return false;
    return true;
  });
}



function sortUsers(users, { field, order = "asc" } = {}) {
  const comparators = {
    full_name: (a, b) => String(a).localeCompare(String(b)),
    country: (a, b) => String(a).localeCompare(String(b)),
    gender: (a, b) => String(a).localeCompare(String(b)),
    course: (a, b) => String(a).localeCompare(String(b)),
    age: (a, b) => Number(a) - Number(b),
    b_date: (a, b) => Date.parse(a) - Date.parse(b),
  };

  const compare = comparators[field];
  if (!compare || !["asc", "desc"].includes(order)) return [...users];

  const direction = order === "desc" ? -1 : 1;

  return [...users].sort((a, b) => {
    const x = a[field];
    const y = b[field];

    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;

    if (field === "age" || field === "b_date") {
      const valX = field === "age" ? Number(x) : Date.parse(x);
      const valY = field === "age" ? Number(y) : Date.parse(y);

      if (isNaN(valX) && isNaN(valY)) return 0;
      if (isNaN(valX)) return 1;
      if (isNaN(valY)) return -1;
    }

    return direction * compare(x, y);
  });
}



function searchUsers(users, query) {
  if (query == null) return [];
  const text = String(query).trim();
  if (text === "") return users;

  if (/^\d+$/.test(text)) {
    const age = Number(text);
    return users.filter(u => u.age === age);
  }

  const lower = text.toLowerCase();
  return users.filter(u =>
    u.full_name?.toLowerCase().includes(lower) ||
    u.note?.toLowerCase().includes(lower)
  );
}



function percentage(total, matched) {
  return total.length === 0 ? 0 : Math.round((matched.length / total.length) * 100);
}



async function getTeachers(amount=50, seed="teachinder") {
  try {
    const url = `https://randomuser.me/api/?results=${amount}` + (seed ? `&seed=${seed}` : "")
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch teachers");
    const data = await res.json();
    return data.results;
  } catch (e) {
    alert(e.message);
    return [];           
  }
}

document.addEventListener('DOMContentLoaded', async function() {
    function saveTeachers() {
      localStorage.setItem("teachers_data", JSON.stringify(teachers));
    }

    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem("teachers_data"));
    } catch {}

    let teachers = Array.isArray(stored) && stored.length ? stored : null;
    if (!teachers) {
      const fetched = await getTeachers();
      teachers = normalizeUsers(fetched);
      if (fetched.length) saveTeachers();
    }
    const addTeacherBtns = document.querySelectorAll('.add_teacher_btn');
    const addTeacherModal = document.getElementById('add-teacher-modal');
    const addTeacherForm = addTeacherModal.querySelector(".form");
    const errorsBox = addTeacherForm.querySelector(".form__errors");
    const teacherInfoModal = document.getElementById('teacher-info-modal');
    const closeAddTeacherModalBtn = addTeacherModal.querySelector('.modal__close');
    const filters = document.querySelector(".top-teachers__filters");
    const loadMoreBtn = document.getElementById('load-more-btn');
    const loadLessBtn = document.getElementById('load-less-btn');
    const table = document.querySelector(".statistics__table");
    const pagination = document.querySelector(".statistics__pagination");
    const searchForm = document.querySelector(".header__search");

    const PAGE_SIZE = 10;
    let currentPage = 1;
    let shown = 0;
    let visibleTeachers = teachers
    let filterQueries = {};
    let searchQuery = "";
    let sortState = {};
    let chart = null;
    let chartCategpry = document.getElementById("chart-category").value;
    let map = null;

    let isLoading = false;
    
    function computeVisibles() {
      let listToRender = filterUsers(teachers, filterQueries);
      listToRender = searchUsers(listToRender, searchQuery);
      listToRender = sortUsers(listToRender, sortState);
      visibleTeachers = listToRender;
    }

    function updateView() {
      computeVisibles();
      document.querySelector(".top-teachers__cards").replaceChildren();
      shown = 0;
      renderNextCards();
      //populateTable(visibleTeachers, 1);
      renderChart(visibleTeachers, chartCategpry || "country");
    }

    function createCountryFilter() {
      const countries = [...new Set(teachers.map(t => t.country).filter(Boolean))].sort();
      return `
        <select name="country" id="filter-region">
          ${`<option value="">All Countries</option>` + countries.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      `;
    }

    function countBy(teachers, field) {
      const counts = new Map();
      if (field == "age") {
        counts.set("18-31", teachers.filter(t => t.age && t.age >= 18 && t.age <= 31).length);
        counts.set("32-45", teachers.filter(t => t.age && t.age >= 32 && t.age <= 45).length);
        counts.set("46-60", teachers.filter(t => t.age && t.age >= 46 && t.age <= 60).length);
        counts.set("61+", teachers.filter(t => t.age && t.age >= 61).length);
      } else {
        for (const teacher of teachers) {
          const key = teacher[field] ?? "Unknown";
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
      return counts;
    }

    function renderChart(teachers, field = document.getElementById("chart-category").value) {
      const counts = [...countBy(teachers, field)].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
      const labels = counts.map(([k]) => k);
      const values = counts.map(([_, v]) => v);
      const colors = labels.map(() => `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`);
      document.querySelector(".statistics__empty").hidden = counts.length > 0;
      if (!chart) {
        chart = new Chart(document.getElementById("statistics-chart"), {
          type: "pie",
          data: { 
            labels, 
            datasets: [{ 
              data: values, 
              backgroundColor: colors 
            }] 
          },
          options: { 
            maintainAspectRatio: false,
            plugins: {
              legend: {position: "bottom"} 
            } 
          },
        });
      } else {
        chart.data.labels = labels;
        chart.data.datasets[0].data = values;
        chart.data.datasets[0].backgroundColor = colors;
        chart.update();
      }
    }

    document.getElementById("chart-category").addEventListener("change", e => {
      chartCategpry = e.target.value;
      renderChart(visibleTeachers, chartCategpry);
    });


    function populatePagination() {
      const totalPages = Math.ceil(visibleTeachers.length / PAGE_SIZE);
      let html = ``;
      for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
          html += `
            <li aria-current="page">${i}</li>
          `;
        } else {
          html += `
            <li>${i}</li>
          `
        }
      }
      pagination.querySelector("ul").innerHTML = html;
    }

    function createTeacherCard(teacher) {
      const [first, ...rest] = teacher.full_name.split(" ");
      const last = rest.join(" ");
      const initials = [first, last].map(p => p[0]).join('.');
    
      const card = document.createElement('article');
      card.id = teacher.id;
      card.className = teacher.favorite ? 'teacher-card favorite' : 'teacher-card';
      card.innerHTML = `
          ${teacher.picture_large
            ? `<div class="teacher-card__photo"><img style="border: 2px solid ${teacher.bg_color}" src="${teacher.picture_large}" alt=""></div>`
            : `<div class="teacher-card__photo"><div style="border: 2px solid ${teacher.bg_color}" class="teacher-card__initials">${initials}</div></div>`}
          <div class="teacher-card__info">
            <div class="teacher-card__name">${first}${last ? `<br>${last}` : ''}</div>
            <div class="teacher-card__subject">${teacher.course ?? 'Unknown'}</div>
            <div class="teacher-card__origin">${teacher.country ?? 'Unknown'}</div>
          </div>
      `;
      return card;
    }

    function renderTeacherCards(teachers, low, high) {
      const container = document.querySelector(".top-teachers__cards");
      teachers.slice(low, high).forEach(t => container.appendChild(createTeacherCard(t)));
    }

    function renderFavorites() {
      const list = document.querySelector(".favorites__carousel");
      list.replaceChildren(
        ...teachers.filter(t => t.favorite).map(t => {
          const li = document.createElement("li");
          li.className = "favorites__item";
          li.appendChild(createTeacherCard(t));
          return li;
        })
      );
    }

    function populateTable(teachers, page) {
      currentPage = page;
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      let html = ``;
      teachers.slice(start, end).forEach(t => {
        html += `
          <tr>
            <td>${t.full_name ?? "Anonym"}</td>
            <td>${t.course ?? "None"}</td>
            <td>${t.age ?? "None"}</td>
            <td>${t.gender ?? "None"}</td>
            <td>${t.country ?? "None"}</td>
          </tr>
        `;
      });
      const tbody = table.querySelector("tbody");
      tbody.innerHTML = html;
      populatePagination();
    }

    function renderCountryFilter() {
      filters.children[1].innerHTML = `
        <div class="top-teachers__filter">
          <label for="filter-region">Region</label>
          ${createCountryFilter()}
        </div>
      `;
    }

    renderFavorites();
    updateView();
    renderCountryFilter();

    function updateButtons() {
      loadLessBtn.style.display = shown > PAGE_SIZE ? '' : 'none';
    }

    function renderNextCards() {
      renderTeacherCards(visibleTeachers, shown, shown + PAGE_SIZE);
      shown = Math.min(shown + PAGE_SIZE, visibleTeachers.length);
      updateButtons();
    }

    function resetControls() {
      filterQueries = {};
      sortState = {};
      searchQuery = "";
      filters.querySelectorAll("select").forEach(s => s.selectedIndex = 0);
      filters.querySelectorAll("input[type='checkbox']").forEach(c => c.checked = false);
      searchForm.reset();
      //table.tHead.querySelectorAll("th").forEach(h => h.setAttribute("aria-sort", "none"));
      renderCountryFilter();
    }

    async function showMore() {
      if (isLoading) return;
      if (shown < visibleTeachers.length) {
        renderNextCards();
        return;
      }
    
      isLoading = true;
      loadMoreBtn.disabled = true;
      try {
        const fetched = await getTeachers(PAGE_SIZE, null);
        teachers.push(...normalizeUsers(fetched));
    
        resetControls();
        visibleTeachers = [...teachers];
        document.querySelector(".top-teachers__cards").replaceChildren();
        renderTeacherCards(visibleTeachers, 0, visibleTeachers.length);
        shown = visibleTeachers.length;
        renderChart(visibleTeachers, chartCategpry || "country");
        updateButtons();
      } finally {
        isLoading = false;
        loadMoreBtn.disabled = false;
      }
    }

    function showLess() {
      const container = document.querySelector('.top-teachers__cards');
      let right = container.children.length - 1;
      for (let i = 0; i < PAGE_SIZE && right >= PAGE_SIZE; i++, right--) {
        container.removeChild(container.children[right]);
      }
      shown = Math.max(shown - PAGE_SIZE, PAGE_SIZE);
      updateButtons();
    }

    // const sortFields = ["full_name", "course", "age", "gender", "country"];

    // table.tHead.addEventListener("click", e => {
    //   const th = e.target.closest("th");
    //   if (!th || !e.target.closest("button")) return;

    //   const field = sortFields[th.cellIndex];
    //   const order = th.getAttribute("aria-sort") === "ascending" ? "desc" : "asc";

    //   table.tHead.querySelectorAll("th").forEach(h => h.setAttribute("aria-sort", "none"));
    //   th.setAttribute("aria-sort", order === "asc" ? "ascending" : "descending");

    //   sortState.field = field;
    //   sortState.order = order;
    //   updateView();
    // });

    // pagination.querySelector("ul").addEventListener("click", e => {
    //   const li = e.target.closest("li");
    //   if (li) {
    //     currentPage = Number(li.textContent);
    //     populateTable(visibleTeachers, currentPage);
    //   }
    // });

    loadMoreBtn.addEventListener('click', showMore);
    loadLessBtn.addEventListener('click', showLess);

    addTeacherBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            addTeacherModal.classList.add("is-open");
            addTeacherModal.setAttribute("aria-hidden", "false");
        });
    });

    addTeacherForm.addEventListener("submit", async e => {
      e.preventDefault();
      const rawData = new FormData(e.currentTarget);
      const teacherData = Object.fromEntries(rawData);
      teacherData.age = new Date().getFullYear() - new Date(teacherData.b_date).getFullYear();
      const teacher = {
        id: crypto.randomUUID(),
        full_name: teacherData.full_name.trim(),
        gender: teacherData.gender,
        city: teacherData.city.trim(),
        state: teacherData.state.trim(),
        country: teacherData.country.trim(),
        email: teacherData.email.trim(),
        phone: teacherData.phone.trim(),
        b_date: new Date(teacherData.b_date).toISOString(),
        age: teacherData.age,
        course: teacherData.course.trim(),
        bg_color: teacherData.bg_color,
        note: teacherData.note.trim(),
        favorite: false,
        ...(teacherData.picture_large.trim() && {picture_large: teacherData.picture_large.trim()}),
      };
      const errors = validateUser(teacher);
      if (teachers.some(t => t.full_name?.toLowerCase() === teacher.full_name.toLowerCase())) {
        errors.push("A teacher with this name already exists");
      }
      if (errors.length === 0) {
        try {
          const res = await fetch("http://localhost:3001/teachers", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(teacher)
          });
          
          if (!res.ok) throw new Error("Couldn't add teacher, try again later");
          alert("Added succesfully");
          teachers.unshift(teacher);
          saveTeachers();
          updateView();
          addTeacherForm.reset();
          addTeacherModal.classList.remove("is-open");
          addTeacherModal.setAttribute("aria-hidden", "true");
        } catch (e) {
          alert(e.message);
          return;
        }
      } else {
        errorsBox.replaceChildren(...errors.map(msg => {
          const li = document.createElement("li");
          li.textContent = msg;
          return li;
        }));
      }
    });

    closeAddTeacherModalBtn?.addEventListener('click', function() {
        addTeacherModal.classList.remove("is-open");
        addTeacherModal.setAttribute("aria-hidden", "true");
    });

    

    filters.addEventListener("change", e => {
      const select = e.target.closest("select");
      const checkbox = e.target.closest("input[type='checkbox']");
      if (select) {
          if (select.name === "age") {
            let minAge;
            let maxAge;
            if (select.value.includes("-")) {
              const parts = select.value.split("-");
              minAge = Number(parts[0]);
              maxAge = Number(parts[1]);
            } else minAge = 61;

            if (minAge) filterQueries.minAge = minAge;
            if (maxAge) filterQueries.maxAge = maxAge;
          } else {
            filterQueries[select.name] = select.value;
          } 
      }
      if (checkbox) {
        filterQueries[checkbox.name] = checkbox.checked;
      }
      updateView();
    });

    searchForm.addEventListener("submit", e => {
      e.preventDefault();
      const rawData = new FormData(searchForm);
      const {query} = Object.fromEntries(rawData);
      searchQuery = query ?? "";
      updateView();
    })
    
    document.querySelector("main").addEventListener("click", e => {
      const target = e.target;
      const card = target.closest(".teacher-card");
      if (card) {
        
        const teacher = teachers.find(t => t.id === card.id);
        const [first, ...rest] = teacher.full_name.split(' ');
        const last = rest.join(' ');
        const initials = [first, last].map(p => p[0]).join('.');
        const now = dayjs();
        const t_b_date = teacher.b_date && dayjs(teacher.b_date);
        let daysUntilBD = null;
        let bdHtml = `<p class="teacher-profile__bd-info">No birthday information provided</p>`;

        if (t_b_date) {
          let nextBD = t_b_date.year(now.year());

          if (nextBD.isBefore(now, 'day')) {
            nextBD = nextBD.add(1, 'year');
          }
          daysUntilBD = nextBD.diff(now, 'day'); 

          if (daysUntilBD === 0) {
            bdHtml = `<p class="teacher-profile__bd-info">${teacher.full_name} birthday is today</p>`;
          } else {
            bdHtml = `<p class="teacher-profile__bd-info">It is <strong>${daysUntilBD}</strong> days left until birthday</p>`;
          }

        }
        

        const demographics = [teacher.age, teacher.gender].filter(v => v != null && v !== "").join(", ") || "Age and gender unknown";

        const emailHtml = teacher.email
          ? `<a href="mailto:${teacher.email}" class="teacher-profile__email">${teacher.email}</a>`
          : `<p class="teacher-profile__email">No email provided</p>`;
          
        teacherInfoModal.innerHTML = `
          <div class="modal__container">
            <header class="modal__header">
              <h3 class="modal__title">Teacher Info</h3>
              <button type="button" class="modal__close" aria-label="Close modal">&times;</button>
            </header>
            <div class="modal__body teacher-profile">
              <div class="teacher-profile__header">
                ${teacher.picture_large
                  ? `<img class="teacher-profile__image" style="border: 2px solid ${teacher.bg_color}" src="${teacher.picture_large}" alt="">`
                  : `<div class="teacher-card__initials" style="border: 2px solid ${teacher.bg_color}">${initials}</div>`}
                <div class="teacher-profile__details">
                  <div class="teacher-profile__title-wrapper">
                    <h2 class="teacher-profile__name">${teacher.full_name}</h2>
                    <button type="button" class="teacher-profile__favorite" aria-label="Add to favorites">${teacher.favorite ? "&#9733;" : "&#9734;"}</button>
                  </div>
                  <p class="teacher-profile__subject">${teacher.course ?? "Unknown subject"}</p>
                  <p class="teacher-profile__location">${teacher.city && teacher.country ? `${teacher.city}, ${teacher.country}` : "Unknown location"}</p>
                  <p class="teacher-profile__demographics">${demographics}</p>
                  ${emailHtml}
                  <p class="teacher-profile__phone">${teacher.phone ?? "Unknown phone"}</p>
                  ${bdHtml}
                </div>
              </div>
              <div class="teacher-profile__about">
                <p>${teacher.note || "No information provided"}</p>
              </div>
              <button type="button" class="teacher-profile__map-toggle">toggle map</button>
              <div id="map" class="map"></div>
            </div>  
          </div>
        `;
        teacherInfoModal.classList.add("is-open");
        teacherInfoModal.setAttribute("aria-hidden", "false");

        const closeModalBtn = teacherInfoModal.querySelector(".modal__close");
        const toggleFavoritesBtn = teacherInfoModal.querySelector(".teacher-profile__favorite");
        const toggleMapBtn = teacherInfoModal.querySelector(".teacher-profile__map-toggle");

        toggleMapBtn.addEventListener("click", () => {
          if (!teacher.coordinates) {
            alert("This teacher doesn't share location");
            return;
          }
          const mapElem = toggleMapBtn.nextElementSibling;
          mapElem.classList.toggle("show-map");
          

          if (mapElem.classList.contains("show-map")) {
            const {latitude, longitude} = teacher.coordinates;
            map = L.map(mapElem).setView([latitude, longitude], 13);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19}).addTo(map);
            L.marker([latitude, longitude]).addTo(map);
          } else {
            map?.remove();
            map = null;
          }

        });

        closeModalBtn.addEventListener("click", function() {
          console.log("Closing teacher info modal");
          teacherInfoModal.classList.remove("is-open");
          teacherInfoModal.setAttribute("aria-hidden", "true");
        });

        toggleFavoritesBtn.addEventListener("click", () => {
          teacher.favorite = !teacher.favorite;
          toggleFavoritesBtn.innerHTML = teacher.favorite ? "&#9733;" : "&#9734;";
        
          document.querySelectorAll('.top-teachers__cards .teacher-card')
          .forEach(c => {
            if (c.id === teacher.id) c.classList.toggle("favorite", teacher.favorite);
          });
          saveTeachers();
          renderFavorites();
        });
      }
    });
});