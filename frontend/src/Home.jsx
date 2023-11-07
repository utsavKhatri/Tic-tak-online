const Home = () => {
  const numberLine = 123;
  Array(numberLine)
    .fill()
    .map((_, index) => {
      return <div key={index}>Home</div>;
    });
};

export default Home;
