describe("Comments Module", () => {
  const deletedId = Cypress._.random(1, 5);
  before("Login", () => cy.login());

  describe("Create comment", () => {
    /**
     * 1. Return unauthorized
     * 2. Return error validation
     * 3. return correct comments
     * 4. Found in get post by id endpoint
     * 5. Found in all posts endpoint
     */
    it("Should return unauthorized", () => {
      cy.checkUnauthorized("POST", "/comments/");
    });

    it("Should return error validation", () => {
      cy.request({
        method: "POST",
        url: "/comments/",
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
        body: {
          post_id: null,
          content: null,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.badRequest(response, [
          "post_id must be a number conforming to the specified constraints",
          "content must be a string",
        ]);
      });
    });

    it("Should return correct comment", () => {
      cy.generateCommentData(5);

      cy.fixture("comments").then((commentsData) => {
        commentsData.forEach((_comment) => {
          cy.request({
            method: "POST",
            url: "/comments/",
            headers: {
              authorization: `Bearer ${Cypress.env("token")}`,
            },
            body: _comment,
          }).then((response) => {
            const {
              success,
              data: { post_id, content },
            } = response.body;
            expect(response.status).to.eq(201);
            expect(success).to.be.true;
            expect(post_id).to.eq(_comment.post_id);
            expect(content).to.eq(_comment.content);
          });
        });
      });
    });

    it("Should be found in get post by id endpoint", () => {
      cy.fixture("comments").then((commentData) => {
        cy.request({
          method: "GET",
          url: `/posts/${commentData[0].post_id}`,
          headers: {
            authorization: `Bearer ${Cypress.env("token")}`,
          },
        }).then((response) => {
          const { comments } = response.body.data;
          const isFound = comments.some(
            (comment) => comment.content === commentData[0].content
          );

          expect(comments).to.be.ok;
          expect(isFound).to.be.ok;
        });
      });
    });

    it("Should be found in get all posts endpoint", () => {
      cy.request({
        method: "GET",
        url: "/posts",
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
      }).then((response) => {
        cy.fixture("comments").then((commentData) => {
          const posts = response.body.data;
          commentData.forEach((comment) => {
            const isFound = posts
              .find((post) => post.id === comment.post_id)
              .comments.some(
                (_comment) => _comment.content === comment.content
              );
            expect(isFound).to.be.ok;
          });
        });
      });
    });
  });

  describe("Delete comment", () => {
    /**
     * 1. Return unauthorized
     * 2. Return not found
     * 3. Successfully deleted
     * 5. Not found in detail posts endpoint
     */

    it("Should return unauthorized", () => {
      cy.checkUnauthorized("DELETE", "/comments/5");
    });

    it("Should return not found", () => {
      cy.request({
        method: "DELETE",
        url: `/comments/${Cypress._.random(6, 10)}`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });

    it("Should successfully delete comments", () => {
      cy.request({
        method: "DELETE",
        url: `/comments/${deletedId}`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
      }).then((response) => {
        const { message, success } = response.body;
        expect(response.status).to.eq(200);
        expect(message).to.eq("Comment deleted successfully");
        expect(success).to.be.ok;
      });
    });

    it("Should be not found in detail posts endpoint", () => {
      cy.fixture("comments").then((commentData) => {
        const deletedComment = commentData[deletedId - 1];

        cy.request({
          method: "GET",
          url: `/posts/${deletedComment.post_id}`,
          headers: {
            authorization: `Bearer ${Cypress.env("token")}`,
          },
        }).then((response) => {
          const { comments } = response.body.data;
          const checkCommentsData = comments.some(
            (comment) =>
              comment.id === deletedId &&
              comment.content === deletedComment.content
          );
          expect(checkCommentsData).to.be.false;
        });
      });
    });
  });
});
