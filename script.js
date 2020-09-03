(function() {

	let scene,  
		renderer,
		camera,
		model,								// Our character
		mixer,								// THREE.js animations mixer
		baseBone,
		idle,								// Idle, the default state our character returns to
		rght,								// Idle to the right
		left,								// Idle to the left
		back,								// Idle facing back
		trnR,								// Turn Right anim
		trnL,								// Turn Left anim
		trnB,								// Turn 180 anim
		clock = new THREE.Clock(),			// Used for anims, which run to a clock instead of frame rate 
		currentlyAnimating = false,			// Check if anim other than idle is in progress
		loaderAnim = document.getElementById('js-loader')

	init()

	function init() {

		const canvas = document.querySelector('#c')
		const backgroundColor = 0xf1f1f1
		const modelPath = 'avi.glb'

		// Scene init
		scene = new THREE.Scene()
		scene.background = new THREE.Color(backgroundColor)
		scene.fog = new THREE.Fog(backgroundColor, 60, 100)

		// Renderer init
		renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
		// renderer.outputEncoding = THREE.sRGBEncoding
		renderer.physicallyCorrectLights = true
		renderer.shadowMap.enabled = true
		renderer.setPixelRatio(window.devicePixelRatio)
		document.body.appendChild(renderer.domElement)

		// Camera
		camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 )
		camera.position.z = 3
		camera.position.y = 1.33
		camera.rotation.x = -0.05 * Math.PI

		// Axes Helper
		// hipBone.forEach((node) => {
		// 	const axes = new THREE.AxesHelper()
		// 	axes.material.depthTest = false
		// 	axes.renderOrder = 1
		// 	node.add(axes)
		// });

		// Mats
		const aviMat = new THREE.MeshBasicMaterial({ color: 'gray', skinning: true }) // 0x9bffaf 0xf5636c

		// glTF loader
		let loader = new THREE.GLTFLoader()

		loader.load(
			modelPath,
			function(gltf) {
				let model = gltf.scene
				let clips = gltf.animations

				root = model.getObjectByName('BoneRoot')

				model.traverse(obj => {

					// if (obj.isBone) {
					// 	console.log(obj)
					// }
					
					if ( obj.isMesh ) {
						obj.castShadow = true 
						obj.receiveShadow = true
						obj.material = aviMat
					}

				})
				
				scene.add(model) // adds model to the scene

				loaderAnim.remove() // removes loader once model is loaded

				mixer = new THREE.AnimationMixer(model)

				let idleAnim = THREE.AnimationClip.findByName(clips, 'idle')
				let turnRght = THREE.AnimationClip.findByName(clips, 'turn1')
				let turnLeft = THREE.AnimationClip.findByName(clips, 'turn2')
				let turnBack = THREE.AnimationClip.findByName(clips, 'turn3')

				let idleRght = idleAnim.clone()
				let idleLeft = idleAnim.clone()
				let idleBack = idleAnim.clone()

				idleRght.tracks.splice(1, 1)
				root.rotation.z = -.5 * Math.PI  // Need to apply this only on idleRght

				idleLeft.tracks.splice(1, 1)
				root.rotation.z = .5 * Math.PI  // Need to apply this only on idleLeft

				idleBack.tracks.splice(1, 1)
				root.rotation.z = -1 * Math.PI  // Need to apply this only on idleLeft
				
				// THREE.AnimationUtils.makeClipAdditive(idleRght) // <--- ???

				idle = mixer.clipAction(idleAnim)
				rght = mixer.clipAction(idleRght)
				left = mixer.clipAction(idleLeft)
				back = mixer.clipAction(idleBack)
				trnR = mixer.clipAction(turnRght)
				trnL = mixer.clipAction(turnLeft)
				trnB = mixer.clipAction(turnBack)

				idle.play()

			},
			undefined, // We don't need this function
			function(error) {
				console.error(error)
			}
		)

		// Hemisphere light
		let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2.7)
		hemiLight.position.set(0, 50, 0)
		scene.add(hemiLight)

		// Directional light
		let d = 1.33 // distance
		let frontLight = new THREE.DirectionalLight(0xffffff, .6)
		frontLight.position.set(-5, 8, 5)
		frontLight.castShadow = true
		frontLight.shadow.mapSize = new THREE.Vector2(1024, 1024) // 1024, 2048, 4096
		frontLight.shadow.camera.near = 0.1
		frontLight.shadow.camera.far = 100
		frontLight.shadow.camera.left = d * -1
		frontLight.shadow.camera.right = d
		frontLight.shadow.camera.top = d
		frontLight.shadow.camera.bottom = d * -1
		scene.add(frontLight)

		// Floor geo & mat
		let floorGeometry = new THREE.PlaneGeometry(100, 100, 1, 1)
		let floorMaterial = new THREE.MeshPhongMaterial({ color: 0xeeeeee, shininess: 0	})
		let floor = new THREE.Mesh(floorGeometry, floorMaterial)
		floor.rotation.x = -0.5 * Math.PI
		floor.receiveShadow = true
		floor.position.y = -.02
		scene.add(floor)

	}

	function update() {
		//  update the mixer to run continuously through the model animation
		if (mixer) {
			mixer.update(clock.getDelta())
		}
		// check + refresh window size
		if (resizeRendererToDisplaySize(renderer)) {
			const canvas = renderer.domElement
			camera.aspect = canvas.clientWidth / canvas.clientHeight
			camera.updateProjectionMatrix()
		}
		renderer.render(scene, camera)
		requestAnimationFrame(update)
	}
	update()

	function resizeRendererToDisplaySize(renderer) {
		const canvas = renderer.domElement
		let width = window.innerWidth
		let height = window.innerHeight
		let canvasPixelWidth = canvas.width / window.devicePixelRatio
		let canvasPixelHeight = canvas.height / window.devicePixelRatio

		const needResize =
			canvasPixelWidth !== width || canvasPixelHeight !== height
		if (needResize) {
			renderer.setSize(width, height, false)
		}
		return needResize
	}

	// Click on LEFT button:
	const btnTrnL = document.getElementById('left')
	btnTrnL.addEventListener('click', playTurnLeft)
	btnTrnL.addEventListener('touchend', playTurnLeft)

	function playTurnLeft() {
		if (!currentlyAnimating) {
			currentlyAnimating = true
			playModifierAnimation(idle, 0.165, trnL, 0.233, left) // Anim' blend in & blend out
		}
	}

	// Click on RIGHT button:
	const btnTrnR = document.getElementById('right')
	btnTrnR.addEventListener('click', playTurnRight)
	btnTrnR.addEventListener('touchend', playTurnRight)

	function playTurnRight() {

		// if (this.classList.contains("active")) {
		// 	this.classList.remove("active")
		// } else this.classList.add("active")

		if (!currentlyAnimating) {
			currentlyAnimating = true
			playModifierAnimation(idle, 0.165, trnR, 0.233, rght)	
		}
	}

	// Click on BACK button:
	const btnBack = document.getElementById('back')
	btnBack.addEventListener('click', playTurnBack)
	btnBack.addEventListener('touchend', playTurnBack)

	function playTurnBack() {
		if (!currentlyAnimating) {
			currentlyAnimating = true
			playModifierAnimation(idle, 0.25, trnB, 0.233, back)
		}
	}


	function playModifierAnimation(from, fSpeed, to, tSpeed, end) {
		to.setLoop(THREE.LoopOnce)
		to.reset()
		to.play()
		from.crossFadeTo(to, fSpeed, true)
		setTimeout(function() {
			end.enabled = true
			to.crossFadeTo(end, tSpeed, true)
			currentlyAnimating = false
			end.play()
		}, to._clip.duration * 1000 - ((tSpeed + fSpeed) * 1000))
	}

})()