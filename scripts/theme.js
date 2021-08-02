let darkSwitch = document.getElementById('darkSwitch')
let darkBtn = document.getElementsByClassName('btn-dark')[0]
let darkOutlineBtn = document.getElementsByClassName('btn-outline-dark')
let lightBtn = document.getElementsByClassName('btn-light')
let lightOutlineBtn = document.getElementsByClassName('btn-outline-light')

window.addEventListener('load', function() {
	if(darkSwitch) {
		darkSwitch.addEventListener('change', function() {
			changeTheme()
		})
	}
})

function changeTheme() {
	if(darkSwitch.checked) {
		document.body.setAttribute('data-theme', 'dark')

		darkBtn.classList.add('btn-light')
		darkBtn.classList.remove('btn-dark')

		for(var i = 0; i < darkOutlineBtn.length; i++) {
			darkOutlineBtn[i].classList.add('btn-outline-light')
			darkOutlineBtn[i].classList.remove('btn-outline-dark')
		}

		for(var i = 0; i < lightBtn.length; i++) {
			lightBtn[i].classList.add('btn-dark')
			lightBtn[i].classList.remove('btn-light')
		}

		for(var i = 0; i < lightOutlineBtn.length; i++) {
			lightOutlineBtn[i].classList.add('btn-outline-dark')
			lightOutlineBtn[i].classList.remove('btn-outline-light')
		}
	} else {
		document.body.removeAttribute('data-theme')

		darkBtn.classList.add('btn-dark')
		darkBtn.classList.remove('btn-light')

		for(var i = 0; i < darkOutlineBtn.length; i++) {
			darkOutlineBtn[i].classList.add('btn-outline-dark')
			darkOutlineBtn[i].classList.remove('btn-outline-light')
		}

		for(var i = 0; i < lightBtn.length; i++) {
			lightBtn[i].classList.add('btn-light')
			lightBtn[i].classList.remove('btn-dark')
		}

		for(var i = 0; i < lightOutlineBtn.length; i++) {
			lightOutlineBtn[i].classList.add('btn-outline-light')
			lightOutlineBtn[i].classList.remove('btn-outline-dark')
		}
	}
}