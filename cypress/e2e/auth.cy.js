describe("Auth Module", () => {
  const userData = {
    name: "Gama QA",
    email: "gama@gmail.com",
    password: "Qwerty_123",
  };

  describe("Register", () => {
    /**
     * 1. Error Validation (null name, email, password)
     * 2. Error Invalid email format gama@nest.test
     * 3. Error Invalid password format
     * 4. Register successfully
     * 5. Error duplicate entry
     */

    it("should return error message for validation", () => {
      cy.request({
        method: "POST",
        url: "/auth/register",
        failOnStatusCode: false,
      }).then((response) => {
        // expect(response.status).to.eq(400);
        // expect(response.body.error).to.eq("Bad Request");
        // // note: to.be.oneOf berguna untuk memastikan data pada array
        // expect("name should not be empty").to.be.oneOf(response.body.message);
        // expect("email should not be empty").to.be.oneOf(response.body.message);
        // expect("password should not be empty").to.be.oneOf(
        //   response.body.message
        // );
        cy.badRequest(response, [
          "name should not be empty",
          "email should not be empty",
          "password should not be empty",
        ]);
      });
    });

    it("should return error message invalid email format", () => {
      cy.request({
        method: "POST",
        url: "/auth/register",
        body: {
          name: userData.name,
          email: "gama @gmail.com",
          password: userData.password,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.badRequest(response, ["email must be an email"]);
      });
    });

    it("should return error message invalid password format", () => {
      cy.request({
        method: "POST",
        url: "/auth/register",
        body: {
          name: userData.name,
          email: userData.email,
          password: "qwerty123",
        },
        failOnStatusCode: false,
      }).then((response) => {
        // expect(response.status).to.eq(400);
        // expect(response.body.error).to.eq("Bad Request");
        // expect("password is not strong enough").to.be.oneOf(
        //   response.body.message
        // );
        cy.badRequest(response, ["password is not strong enough"]);
      });
    });

    it("should successfully register", () => {
      cy.resetUsersRegister();
      cy.request({
        method: "POST",
        url: "/auth/register",
        body: userData,
      }).then((response) => {
        const { id, name, email, role, password } = response.body.data;
        expect(response.status).to.eq(201);
        expect(response.body.success).to.be.true;
        expect(id).not.to.be.undefined;
        expect(name).to.eq(userData.name);
        expect(email).to.be.eq(userData.email);
        expect(role).to.be.eq("member");
        expect(password).to.be.undefined;
      });
    });

    it("should return error message duplicate email", () => {
      cy.request({
        method: "POST",
        url: "/auth/register",
        body: userData,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.eq(500);
        expect(response.body.success).to.be.false;
        expect(response.body.message).to.be.eq("Email already exists");
      });
    });
  });

  describe("Login", () => {
    /**
     * 1. Unauthorized
     * 2. Return access token success login
     */

    it("should return unauthorized on failed", () => {
      cy.request({
        method: "POST",
        url: "/auth/login",
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.eq(401);
        expect(response.body.message).to.be.eq("Unauthorized");
      });

      //   Wrong Password
      cy.request({
        method: "POST",
        url: "/auth/login",
        body: {
          email: userData.email,
          password: "wrong password",
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.unauthorized(response);
      });

      //   Wrong Email
      cy.request({
        method: "POST",
        url: "/auth/login",
        body: {
          email: "wrong@gmail.com",
          password: userData.password,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.unauthorized(response);
      });
    });

    it("should return access token on success login", () => {
      cy.request({
        method: "POST",
        url: "/auth/login",
        body: {
          email: userData.email,
          password: userData.password,
        },
      }).then((response) => {
        expect(response.status).to.be.eq(201);
        expect(response.body.success).to.be.true;
        expect(response.body.data.access_token).not.to.be.undefined;
        expect(response.body.message).to.be.eq("Login success");
      });
    });
  });

  describe("Me", () => {
    /**
     * 1. error unauthorized
     * 2. return correct current data
     */

    before("do login", () => {
      cy.login();
    });

    it("should return unauthorized when send no token", () => {
      cy.checkUnauthorized("GET", "/auth/me");
    });

    it("Should return correct data", () => {
      cy.request({
        method: "GET",
        url: "/auth/me",
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
      }).then((response) => {
        expect(response.status).to.be.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data.name).to.be.eq(userData.name);
        expect(response.body.data.email).to.be.eq(userData.email);
        expect(response.body.message).to.be.eq("Get current user");
      });
    });
  });
});
