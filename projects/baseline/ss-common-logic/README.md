#SHARED LIB

##NOT TODO IN CODE 

DO NOT WRAP async name() {  }   IN region @backend


Names of complex properties in entities needs to have proper plular forms eg. :

class Author { // singular for "author: , plular "authors"

}

class Book {
  @ManyToMan(); authors: Author[] // OK
  
  @ManyToMan(); authors: Author[] // ERROR
   
}
