const userModel = firebase.auth()

const DB = firebase.firestore()

const app = Sammy('#container', function () {

    this.use('Handlebars', 'hbs')   // da se orientira da izpolzva hbs

    //Home routes
    this.get('/home', function (context) {
        DB.collection('destinations')
            .get()
            .then((response) => {
                //console.log(response);
                //console.log('test');
                context.dests = []
                response.forEach((dest) => {
                    context.dests.push({
                        id: dest.id,
                        ...dest.data()
                    })
                })
                
                extendContext(context)
                    .then(function () {
                        this.partial('./templates/home.hbs')
                    })
            })
            .catch(errorHandler)
    });

    //user routes
    this.get('/register', function (context) {
        extendContext(context).then(function () {
            this.partial('./templates/register.hbs')
        })
    });

   
    this.post('/register', function (context) {   // post zaqvka
        const { email, password, rePassword } = context.params;
        if (password !== rePassword) {
            return
        }
        userModel.createUserWithEmailAndPassword(email, password)
            .then((userData) => {
                saveUserData(userData) // dali raboti?
                this.redirect('#/home');
            })
            .catch(errorHandler)
    })
 
    this.get('/login', function (context) {
        extendContext(context).then(function () {
            this.partial('./templates/login.hbs')
        })

    });

    this.post('/login', function (context) {
        //console.log(context);
        const { email, password } = context.params
        userModel.signInWithEmailAndPassword(email, password)
            .then((userData) => {
                //console.log(userData);
                saveUserData(userData)
                this.redirect('#/home')
            })
            .catch(errorHandler)
    })

    this.get('/logout', function (context) {
        userModel.signOut()
            .then((response) => {
                clearUserData();
                this.redirect('#/home')
            })
            .catch(errorHandler)
    })


 

    //offers routes 
    this.get('/create', function (context) { // also make sure to add /create-offer to templ href
        extendContext(context).then(function () {
            this.partial('./templates/create.hbs')
        })
    });

  

    this.post('/create', function (context) {
        const { destination, city, duration, departureDate, imgUrl } = context.params
        console.log(context);

        DB.collection('destinations').add({
            destination,
            city,
            duration,
            departureDate,
            imgUrl,
            owner: getUserData().uid
        })
            .then((createProduct) => {
                console.log(createProduct);
                alert ('Created!')
                this.redirect('#/home')
            })
            .catch(errorHandler)

    })

  

    this.get('/details/:offerId', function (context) {  // tova offerId idva ot rutera, zashtoto ocakva neshto da byde sled details i taka go vzimame  

        const { offerId } = context.params;

        DB.collection('destinations')
            .doc(offerId)
            .get()
            .then((response) => {
                // console.log(response.data);
                //console.log({...response.data});

                const actualOfferData = response.data();
                const imTheOwner = actualOfferData.owner === getUserData().uid  // true ili false dava
                context.offer = { ...response.data(), imTheOwner, id: offerId }

                extendContext(context)
                    .then(function () {
                        this.partial('./templates/details.hbs')
                    })
            })
    });

    this.get('/delete/:offerId', function (context) {
        const { offerId } = context.params
        DB.collection('destinations')
            .doc(offerId)
            .delete()
            .then(() => {
                this.redirect('#/home')
                alert('Deleted!')
            })
            .catch(errorHandler)
    })  // tova trqbva da e delete, tam otiva href

    this.get('/edit/:id', function (context) {
        extendContext(context).then(function () {
            this.partial('./templates/edit.hbs')
        })
    });
    

    this.get('/edit/:offerId', function (context) {
        const { offerId } = context.params


        DB.collection('destinations')
            .doc(offerId)
            .get()
            .then((response) => {
                //   console.log(response.data());  // data() - interesno
                context.offer = { id: offerId, ...response.data() };
                extendContext(context)
                    .then(function () {
                        this.partial('./templates/edit.hbs')
                    })
            })
    })

    this.post('/edit/:offerId', function (context) {
        //const { offerId } = context.params
        // console.log(context.params);
        const { destination, city, duration, departureDate, imgUrl, offerId } = context.params
        if( destination !='' && city!='' && duration !='' && departureDate !='' && imgUrl !='' ){
            const newValues = {
                destination,
                city,
                duration,
                departureDate,
                imgUrl
            }
            DB.collection('destinations')
                .doc(offerId)
                .update(newValues)
                .then((response) => {
                    alert('Edited!')
                    this.redirect(`#/details/${offerId}`)
                })
                .catch(errorHandler)
        }

       

    })

    this.get('/mydestinations', function (context) {
        DB.collection('destinations')
            .get()
            .then((response) => {
                //console.log(response);
                //console.log('test');
                context.dests = []
                response.forEach((dest) => {

                    const actualOfferData = dest.data();
                    const imTheOwner = actualOfferData.owner === getUserData().uid  // true ili false dava
                   

                    context.dests.push({
                        id: dest.id,
                        imTheOwner,
                        ...dest.data()
                    })
                })
                
                extendContext(context)
                    .then(function () {
                        this.partial('./templates/mydestinations.hbs')
                    })
            })
            .catch(errorHandler)
    });
    

}); // tova e vajnooo - ";"


(() => {
    app.run('/home');
})();

function extendContext(context) {

    const user = getUserData();
    context.isLoggedIn = Boolean(user);
    context.userEmail = user ? user.email : '';
    //context.isLoggedIn = Boolean(getUserData())

    return context.loadPartials({
        'header': './partials/header.hbs',
        'footer': './partials/footer.hbs'
    })
}

function saveUserData(data) {
    const { user: { email, uid } } = data;
    localStorage.setItem('user', JSON.stringify({ email, uid }))
}

function getUserData() {
    let user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function clearUserData() {
    this.localStorage.removeItem('user')
}

function errorHandler(error) {
    console.log(error);

}