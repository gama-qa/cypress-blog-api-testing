describe("Post Module", () => {
  const dataCount = 15;
  const randomId = Cypress._.random(16, 70);
  before("Should success login", () => {
    cy.login();
  });

  before("Generate posts data", () => cy.generatePostsData(dataCount));

  describe("Create Post", () => {
    /**
     * 1. Return unauthorized
     * 2. Return error validation error
     * 3. Return correct post
     */

    it("should return unauthorized", () => {
      cy.checkUnauthorized("POST", "/posts");
    });

    it("should return error validation message", () => {
      cy.request({
        method: "POST",
        url: "/posts",
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.badRequest(response, [
          "title must be a string",
          "content must be a string",
        ]);
      });
    });

    it("Should return corret post data", () => {
      cy.fixture("posts").then((postData) => {
        cy.request({
          method: "POST",
          url: "/posts",
          headers: {
            authorization: `Bearer ${Cypress.env("token")}`,
          },
          body: {
            title: postData[0].title,
            content: postData[0].content,
          },
        }).then((response) => {
          const {
            success,
            data: { title, content, comments },
          } = response.body;
          expect(response.status).to.be.eq(201);
          expect(success).to.be.true;
          expect(title).to.be.eq(postData[0].title);
          expect(content).to.be.eq(postData[0].content);
          expect(comments.length).to.be.eq(0);
          expect(response.statusText).to.be.eq("Created");
        });
      });
    });
  });

  describe("Get all data posts", () => {
    /**
     * 1. return unauthorized
     * 2. return correct count and data
     */

    // return unauthorized
    it("should return unauthorized", () => {
      cy.checkUnauthorized("GET", "/posts");
    });

    // return correc count and data
    it("Should return correct count and data", () => {
      cy.fixture("posts").then((postData) => {
        // Call create posts commands
        cy.createPosts(postData);
        // Get all data posts
        cy.request({
          method: "GET",
          url: "/posts",
          headers: {
            authorization: `Bearer ${Cypress.env("token")}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.true;
          expect(response.body.data.length).to.eq(postData.length);
          postData.forEach((_post, index) => {
            expect(response.body.data[index].id).to.eq(index + 1);
            expect(response.body.data[index].title).to.eq(_post.title);
            expect(response.body.data[index].content).to.eq(_post.content);
          });
        });
      });
    });
  });

  describe("Get data posts by ID", () => {
    /**
     * 1. Return unauthorized
     * 2. Return correct data posts by ID
     * 3. Return not found (Negative scenario)
     */

    it("Should return unauthorized", () => {
      cy.checkUnauthorized("GET", "/posts/1");
    });

    it("Should return correct data by ID", () => {
      cy.fixture("posts").then((postData) => {
        postData.forEach((_post, index) => {
          cy.request({
            method: "GET",
            url: `/posts/${index + 1}`,
            headers: {
              authorization: `Bearer ${Cypress.env("token")}`,
            },
          }).then((response) => {
            const { title, content } = response.body.data;
            expect(response.status).to.be.ok;
            expect(title).to.eq(_post.title);
            expect(content).to.eq(_post.content);
          });
        });
      });
    });

    it("Should return not found data posts", () => {
      cy.request({
        method: "GET",
        url: `/posts/${randomId}`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.success).to.be.false;
        expect(response.body.data).to.be.null;
      });
    });
  });

  describe("Update data by ID", () => {
    /**
     * 1. Return unauthorized
     * 2. Return not found
     * 3. Return error validation
     * 4. Return correct updated data
     */

    //Check Unauthorized
    it("Should return unauthorized", () => {
      cy.checkUnauthorized("PATCH", "/posts/1");
    });

    //Check not found data
    it("Should return not found data posts", () => {
      cy.request({
        method: "PATCH",
        url: `/posts/${randomId}`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.success).to.be.false;
        expect(response.body.data).to.be.null;
      });
    });

    //Error validation
    it("Should return error validation message", () => {
      cy.request({
        method: "PATCH",
        url: `/posts/1`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
        failOnStatusCode: false,
        body: {
          title: false,
          content: randomId,
        },
      }).then((response) => {
        cy.badRequest(response, [
          "title must be a string",
          "content must be a string",
        ]);
      });
    });

    //Return correct data updated posts
    it("Should return correct updated posts", () => {
      const dataUpdatePosts = {
        id: 1,
        title: "Updated Title",
        content: "Updated Content",
      };

      //Update posts
      cy.request({
        method: "PATCH",
        url: `/posts/${dataUpdatePosts.id}`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },

        body: {
          title: dataUpdatePosts.title,
          content: dataUpdatePosts.content,
        },
      }).then((response) => {
        const {
          success,
          data: { title, content },
        } = response.body;
        expect(response.status).to.eq(200);
        expect(success).to.be.true;
        expect(title).to.eq(dataUpdatePosts.title);
        expect(content).to.eq(dataUpdatePosts.content);
      });

      //Chek get data by id
      cy.request({
        method: "GET",
        url: `/posts/${dataUpdatePosts.id}`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
      }).then((response) => {
        const { title, content } = response.body.data;
        expect(response.status).to.be.ok;
        expect(title).to.eq(dataUpdatePosts.title);
        expect(content).to.eq(dataUpdatePosts.content);
      });

      //Check get all posts
      cy.request({
        method: "GET",
        url: "/posts",
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
      }).then((response) => {
        const post = response.body.data.find(
          (_post) => _post.id === dataUpdatePosts.id
        );
        expect(post.title).to.eq(dataUpdatePosts.title);
        expect(post.content).to.eq(dataUpdatePosts.content);
      });
    });
  });

  describe("Delete data posts", () => {
    /**
     * 1. Return Unauthorized
     * 2. Return not found data
     * 3. Successfully remove the posts
     * 4. Not be found the deleted posts
     */

    //Check unuthorized
    it("Should return unauthorized", () => {
      cy.checkUnauthorized("DELETE", "/posts/1");
    });

    //Return not found delete data
    it("Should return not found data posts", () => {
      cy.request({
        method: "DELETE",
        url: `/posts/${randomId}`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.success).to.be.false;
        expect(response.body.data).to.be.null;
      });
    });

    it("Should successfully remove data posts", () => {
      cy.request({
        method: "DELETE",
        url: `/posts/1`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
      }).then((response) => {
        expect(response.status).to.be.ok;
        expect(response.body.success).to.be.true;
        expect(response.body.message).to.eq("Post deleted successfully");
      });
    });

    it("Should not be found the deleted posts", () => {
      //Chek get data by id
      cy.request({
        method: "GET",
        url: `/posts/1`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
      });

      //Check get all posts
      cy.request({
        method: "GET",
        url: "/posts",
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
      }).then((response) => {
        const post = response.body.data.find((_post) => _post.id === 1);
        expect(post).to.be.undefined;
      });
    });
  });
});
