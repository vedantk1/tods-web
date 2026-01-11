<template>
  <section id="adminlogin">
    <div class="columns is-mobile">
      <div class="column p-0">
        <p
          class="px-6 pt-6 is-size-5 mt-6 has-text-weight-semibold has-text-centered"
        >
          Ride with Ease, Arrive with Peace - Your Reliable Taxi Service!
        </p>
        <img src="@/assets/img/loginbg.jpg" alt="" />
      </div>
      <div class="column p-0">
        <div class="logbg">
          <div class="loginpage">
            <img src="@/assets/img/logo.png" alt="" />

            <div class="welcomeback">
              <h4>Welcome Back!</h4>
              <p>Don't have an account? <a href="">Signup Now</a></p>
            </div>

            <div class="inputform mt-5">
              <b-field
                class="mb-4"
                label="Email"
                type="is-danger"
                message="This email is invalid"
              >
                <b-input type="email" value="john@" maxlength="30"> </b-input>
              </b-field>

              <div class="is-flex-direction-row is-justify-content-end">
                <b-field label="Password">
                  <b-input
                    type="password"
                    value="iwantmytreasure"
                    password-reveal
                  >
                  </b-input>
                </b-field>

                <div class="fp">
                  <a href="">forgotpassword?</a>
                </div>
              </div>

              <b-button type="is-primary is-light" class="signinbtn"
                >Sign in</b-button
              >

              <p class="inpp">
                By continuing, you acknowledge that you have read, understood,
                and agree to our <a href="">terms and conditions.</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script>
export default {
  layout: 'login',
  data() {
    return {
      name: 'John Silver',
    }
  },
}
</script>
